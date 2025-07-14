const Opd = require('../models/Opd');
const Patient = require('../models/Patient');

module.exports = (io, socket) => {

  // Register display role
  socket.on('register_role', (role) => {
    if (role === 'display') {
      sendDisplayData(socket);
    }
  });

  // Display requests current queue state
  socket.on('get_display_data', async () => {
    sendDisplayData(socket);
  });

  // Function to emit current data to display
  async function sendDisplayData(targetSocket) {
    try {

      const opds = await Opd.find({});
      const data = await Promise.all(opds.map(async (opd) => {
        let patient = null;
        if (opd.currentPatientId) {
          patient = await Patient.findOne({
            patientId: opd.currentPatientId
          });
        }
        return {
          opdNumber: opd.opdNumber,
          currentPatient: patient ? `${patient.patientId}` : '-'
        };
      }));

      targetSocket.emit('display_data', data);
      
    } catch (err) {
      console.error('Failed to send display data:', err);
      targetSocket.emit('display_error', 'Failed to load display data');
    }
  }


};
