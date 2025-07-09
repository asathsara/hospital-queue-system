const Opd = require('../models/Opd');
const Patient = require('../models/Patient');

function startAutoAssign(io) {
  setInterval(async () => {
    // Find all assigned OPDs with no current patient
    const opds = await Opd.find({ isAssigned: true, currentNumber: null });
    for (const opd of opds) {
      // Find the next waiting patient with no OPD assigned
      const patient = await Patient.findOne({ opd: null, status: 'waiting' }).sort({ createdAt: 1 });
      if (patient) {
        // Assign patient to this OPD and give them a queue number
        patient.opd = opd.opdNumber;
        // Find the max number in this OPD queue
        const lastPatient = await Patient.findOne({ opd: opd.opdNumber }).sort({ number: -1 });
        patient.number = lastPatient ? lastPatient.number + 1 : 1;
        patient.status = 'called';
        await patient.save();
        opd.currentNumber = patient.number;
        await opd.save();
        io.emit('queue_update');
      }
    }
  }, 2000); // every 2 seconds
}

module.exports = startAutoAssign;