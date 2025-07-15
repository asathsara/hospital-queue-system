const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { handlerFunction } = require('../socket/opdHandlers');
const Opd = require('../models/Opd');
const Patient = require('../models/Patient');

describe('OPD socket handlers', () => {
  let io, serverSocket, clientSocket, httpServer, mongoServer;
  let activeOPDs = new Map();

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    await new Promise((resolve) => {
      httpServer = createServer();
      io = new Server(httpServer);
      httpServer.listen(() => {
        const port = httpServer.address().port;
        clientSocket = new Client(`http://localhost:${port}`);

        io.on('connection', (socket) => {
          serverSocket = socket;
          handlerFunction(io, socket, activeOPDs);
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
    activeOPDs.clear();
  });

  afterEach(() => {
    clientSocket.removeAllListeners();
  });

  it('should add an OPD', (done) => {
    clientSocket.emit('add_opd', { opdNumber: 1, doctorName: 'Dr. Alice' });

    clientSocket.on('opd_list_updated', async () => {
      const opds = await Opd.find({});
      expect(opds.length).toBe(1);
      expect(opds[0].doctorName).toBe('Dr. Alice');
      expect(opds[0].isAssigned).toBe(false);
      done();
    });
  });

  it('should select an OPD and assign a patient', async () => {
    await Opd.create({ opdNumber: 1, doctorName: 'Dr. Alice', isAssigned: false });
    await Patient.create({ patientId: 'P01', name: 'Patient 1', nic: '111', status: 'waiting' });

    const promise = new Promise((resolve) => {
      clientSocket.on('opd_assigned', resolve);
    });

    clientSocket.emit('select_opd', 1);
    await promise;

    const updatedOpd = await Opd.findOne({ opdNumber: 1 });
    expect(updatedOpd.isAssigned).toBe(true);
    expect(activeOPDs.size).toBe(1);

    const calledPatient = await Patient.findOne({ patientId: 'P01' });
    expect(calledPatient.status).toBe('called');
    expect(calledPatient.opd).toBe(1);
  });

  it('should unassign an OPD and mark current patient as done', async () => {
    await Patient.create({ patientId: 'P01', name: 'Patient A', nic: '999', status: 'called', opd: 1 });
    const opd = await Opd.create({
      opdNumber: 1,
      doctorName: 'Dr. Bob',
      isAssigned: true,
      currentPatientId: 'P01',
    });

    const promise = new Promise((resolve) => {
      clientSocket.on('opd_list_updated', resolve);
    });

    clientSocket.emit('unassign_opd', opd._id.toString());
    await promise;

    const updatedOpd = await Opd.findById(opd._id);
    const updatedPatient = await Patient.findOne({ patientId: 'P01' });

    expect(updatedOpd.isAssigned).toBe(false);
    expect(updatedOpd.currentPatientId).toBe(null);
    expect(updatedPatient.status).toBe('done');
  });

  it('should delete an OPD after unassigning it', async () => {
    const opd = await Opd.create({
      opdNumber: 1,
      doctorName: 'Dr. Delete',
      isAssigned: true,
      currentPatientId: null,
    });

    const promise = new Promise((resolve) => {
      clientSocket.on('opd_list_updated', resolve);
    });

    clientSocket.emit('delete_opd', opd._id.toString());
    await promise;

    const result = await Opd.findById(opd._id);
    expect(result).toBeNull();
  });
});
