const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const registerPatientHandlers = require('../socket/patientHandlers');
const Patient = require('../models/Patient');
const Opd = require('../models/Opd');

describe('patientHandlers', () => {
    let io, serverSocket, clientSocket, httpServer, mongoServer;

    // Before all tests, set up the server and database
    beforeAll(async () => {
        // 1. Set up an in-memory MongoDB server
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);

        // 2. Set up our test server and a client
        await new Promise((resolve) => {
            httpServer = createServer();
            io = new Server(httpServer);

            httpServer.listen(() => {
                const port = httpServer.address().port;
                clientSocket = new Client(`http://localhost:${port}`);

                // 3. Register the handlers we want to test
                io.on('connection', (socket) => {
                    serverSocket = socket;
                    const activeOPDs = new Map(); // A fresh map for our tests
                    registerPatientHandlers(io, socket, activeOPDs);
                });

                clientSocket.on('connect', resolve);
            });
        });
    });

    // After all tests, clean up everything
    afterAll(async () => {
        io.close();
        clientSocket.close();
        await mongoose.disconnect();
        await mongoServer.stop();
        // httpServer.close() is not needed if io.close() is called
    });

    // Before each test, clean the database
    beforeEach(async () => {
        await Patient.deleteMany({});
        await Opd.deleteMany({});
    });

    describe('add_patient', () => {
        it('should create a new patient and broadcast an update', (done) => {
            const patientData = { name: 'John Doe', nic: '123456789V' };

            // Listen for the confirmation event from the server
            clientSocket.on('patient_list_updated', async () => {
                try {
                    // Check if the patient was saved to the database
                    const patient = await Patient.findOne({ name: 'John Doe' });
                    expect(patient).not.toBeNull();
                    expect(patient.patientId).toBe('P01');
                    expect(patient.nic).toBe('123456789V');
                    expect(patient.status).toBe('waiting');

                    // Since we are done with this test, remove the listener to avoid interference
                    clientSocket.off('patient_list_updated');
                    done();
                } catch (e) {
                    done(e);
                }
            });

            // Trigger the event from the client
            clientSocket.emit('add_patient', patientData);
        });

        it('should generate sequential patient IDs', async () => {
            // Arrange: Create a patient to establish a "last" patient
            await Patient.create({ patientId: 'P01', name: 'Jane Doe', nic: '987654321V' });
            const patientData = { name: 'John Smith', nic: '112233445V' };

            // Act: Emit the event and wait for the server's response
            const promise = new Promise(resolve => clientSocket.on('patient_list_updated', resolve));
            clientSocket.emit('add_patient', patientData);
            await promise;

            // Assert: Check the database for the new patient
            const newPatient = await Patient.findOne({ name: 'John Smith' });
            expect(newPatient).not.toBeNull();
            expect(newPatient.patientId).toBe('P02');

            // Clean up listener
            clientSocket.off('patient_list_updated');
        });

        it('should attempt to auto-assign a patient if an OPD is free', (done) => {
            const patientData = { name: 'Peter Pan', nic: '555555555V' };

            // Arrange: Setup a free OPD in the database
            Opd.create({ opdNumber: 1, doctorName: 'Dr. Hook', isAssigned: true, currentPatientId: null });

            clientSocket.on('patient_list_updated', async () => {
                // Assert: The patient should now be 'called' and assigned to OPD 1
                const patient = await Patient.findOne({ name: 'Peter Pan' });
                expect(patient).not.toBeNull();
                expect(patient.status).toBe('called');
                expect(patient.opd).toBe(1);

                clientSocket.off('patient_list_updated');
                done();
            });

            // Act
            clientSocket.emit('add_patient', patientData);
        });
    });
});