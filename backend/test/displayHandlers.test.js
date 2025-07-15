const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const displayHandlers = require('../socket/displayHandlers');
const Opd = require('../models/Opd');
const Patient = require('../models/Patient');

describe('displayHandlers', () => {
  let io, serverSocket, clientSocket, httpServer, mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    await new Promise((resolve) => {
      httpServer = createServer();
      io = new Server(httpServer);

      httpServer.listen(() => {
        const port = httpServer.address().port;
        clientSocket = new Client(`http://localhost:${port}`);

        io.on('connection', (socket) => {
          serverSocket = socket;
          displayHandlers(io, socket);
        });

        clientSocket.on('connect', resolve);
      });
    });
  });

  afterAll(async () => {
    io.close();
    clientSocket.close();
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Opd.deleteMany();
    await Patient.deleteMany();
  });

  afterEach(() => {
    clientSocket.removeAllListeners();
  });

  it('should send display data when register_role is display', async () => {
    // Arrange: create a sample OPD with a patient
    await Patient.create({ patientId: 'P01', name: 'Test Patient', nic: '123', status: 'called' });
    await Opd.create({ opdNumber: 1, doctorName: 'Dr. Test', isAssigned: true, currentPatientId: 'P01' });

    // Act: emit the role registration
    const promise = new Promise((resolve) => {
      clientSocket.on('display_data', (data) => {
        expect(data.length).toBe(1);
        expect(data[0].opdNumber).toBe(1);
        expect(data[0].currentPatient).toBe('P01');
        resolve();
      });
    });

    clientSocket.emit('register_role', 'display');
    await promise;
  });

  it('should return "-" when no patient is assigned to an OPD', async () => {
    await Opd.create({ opdNumber: 2, doctorName: 'Dr. Free', isAssigned: false, currentPatientId: null });

    const promise = new Promise((resolve) => {
      clientSocket.on('display_data', (data) => {
        expect(data.length).toBe(1);
        expect(data[0].opdNumber).toBe(2);
        expect(data[0].currentPatient).toBe('-');
        resolve();
      });
    });

    clientSocket.emit('get_display_data');
    await promise;
  });
});
