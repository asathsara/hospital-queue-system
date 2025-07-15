const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Opd = require('../models/Opd');
const Patient = require('../models/Patient');
const { assignNextPatientToOpd } = require('../socket/autoAssigner');

describe('assignNextPatientToOpd', () => {
  let mongoServer;
  const fakeIO = { emit: jest.fn() }; 

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Opd.deleteMany();
    await Patient.deleteMany();
  });

  it('should assign the next waiting patient to a free OPD', async () => {
    // Arrange
    await Opd.create({ opdNumber: 1, doctorName: 'Dr. Test', isAssigned: true, currentPatientId: null });

    await Patient.create([
      { patientId: 'P01', name: 'A', status: 'waiting', opd: null, createdAt: new Date('2023-01-01') },
      { patientId: 'P02', name: 'B', status: 'waiting', opd: null, createdAt: new Date('2023-01-02') }
    ]);

    // Act
    const assignedPatient = await assignNextPatientToOpd(1, fakeIO);

    // Assert
    expect(assignedPatient).not.toBeNull();
    expect(assignedPatient.patientId).toBe('P01');
    expect(assignedPatient.opd).toBe(1);
    expect(assignedPatient.status).toBe('called');

    const updatedOpd = await Opd.findOne({ opdNumber: 1 });
    expect(updatedOpd.currentPatientId).toBe('P01');
  });

  it('should return null if no free OPD is found', async () => {
    // No OPD created
    const result = await assignNextPatientToOpd(1, fakeIO);
    expect(result).toBeNull();
  });

  it('should return null if no waiting patients are available', async () => {
    await Opd.create({ opdNumber: 1, doctorName: 'Dr. Alone', isAssigned: true, currentPatientId: null });
    const result = await assignNextPatientToOpd(1, fakeIO);
    expect(result).toBeNull();
  });
});
