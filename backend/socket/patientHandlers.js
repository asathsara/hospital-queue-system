const Patient = require('../models/Patient');
const Opd = require('../models/Opd');
const { assignNextPatientToOpd } = require('./autoAssigner');

function generatePatientId(lastId) {
  if (!lastId) return 'P01';
  const num = parseInt(lastId.replace('P', '')) + 1;
  return 'P' + num.toString().padStart(2, '0');
}

module.exports = (io, socket, activeOPDs) => {
  socket.on('add_patient', async ({ name, nic }) => {
    try {

      // Get the most recently created patient (latest by createdAt)
      const last = await Patient.findOne().sort({ createdAt: -1 });
      const newId = generatePatientId(last?.patientId);

      // Create new patient with the generated ID
      const patient = await Patient.create({
        patientId: newId,
        name,
        nic,
        opd: null,
        status: 'waiting',
      });

      // --- Auto assign to free OPD if available ---
      const activeOpds = await Opd.find({ isAssigned: true });
      const freeOpds = activeOpds.filter(opd => !opd.currentPatientId);

      if (freeOpds.length > 0) {
        const targetOpd = freeOpds.sort((a, b) => a.opdNumber - b.opdNumber)[0];

        // Assign next patient and notify the doctor
        const assignedPatient = await assignNextPatientToOpd(targetOpd.opdNumber, io);

        //  2 - Notify the opd that a patient has been assigned
        for (const [socketId, assignedOpdNumber] of activeOPDs.entries()) {
          if (assignedOpdNumber === assignedPatient.opd) {
            io.to(socketId).emit('patient_called', assignedPatient);
          }
        }
      }

      // 7 - Notify the admin and display that the patient list has been updated
      io.emit('patient_list_updated');

    } catch (err) {

      console.error(err);
      socket.emit('error', 'Failed to add patient');
    }
  });

  // Handle fetching all patients
  socket.on('get_patients', async () => {

    const patients = await Patient.find({});
    socket.emit('patients_list', patients);
  });

  const handlePatientOpdCleanup = async (patient) => {
    if (patient.opd) {
      const opd = await Opd.findOne({ opdNumber: patient.opd });

      if (opd && opd.currentPatientId === patient.patientId) {
        opd.currentPatientId = null;
        await opd.save();

        const newPatient = await assignNextPatientToOpd(opd.opdNumber, io);


        // send to the opd even new patient is null, frontend will handle it
        for (const [socketId, assignedOpdNumber] of activeOPDs.entries()) {
          if (assignedOpdNumber === opd.opdNumber) {
            io.to(socketId).emit('patient_called', newPatient);
          }

        }
      }
    }
  };

  socket.on('delete_patient', async (patientId) => {
    try {
      const patient = await Patient.findOne({ patientId });

      if (patient) {
        await handlePatientOpdCleanup(patient);
        await Patient.deleteOne({ patientId });
      }

      io.emit('patient_list_updated');

    } catch (err) {
      console.error('Error deleting patient:', err);
      socket.emit('error', 'Failed to delete patient');
    }
  });

  socket.on('delete_all_patients', async () => {
    try {
      const allPatients = await Patient.find({});

      for (const patient of allPatients) {
        await handlePatientOpdCleanup(patient);
      }

      await Patient.deleteMany({});
      io.emit('patient_list_updated');

    } catch (err) {
      console.error('Error deleting all patients:', err);
      socket.emit('error', 'Failed to delete all patients');
    }
  });

};
