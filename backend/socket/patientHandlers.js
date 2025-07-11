const Patient = require('../models/Patient');
const Opd = require('../models/Opd');
const { assignNextPatientToOpd } = require('./autoAssigner');

function generatePatientId(lastId) {
  if (!lastId) return 'P01';
  const num = parseInt(lastId.replace('P', '')) + 1;
  return 'P' + num.toString().padStart(2, '0');
}

module.exports = (io, socket) => {
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
        io.emit('patient_called', assignedPatient);
      }

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

  // Handle patient deletion
  socket.on('delete_patient', async (patientId) => {

    await Patient.deleteOne({ patientId });
    io.emit('patient_list_updated');
  });
};
