const Patient = require('../models/Patient');

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

      io.emit('patient_list_updated');
      socket.emit('patient_added', patient);

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
