const Opd = require('../models/Opd');
const Patient = require('../models/Patient');

async function assignNextPatientToOpd(opdNumber, io) {

    // Find the OPD that is assigned and has no current patient
    const opd = await Opd.findOne({ opdNumber, isAssigned: true, currentPatientId: null });
    if (!opd) return null;

    const patient = await Patient.findOne({ opd: null, status: 'waiting' }).sort({ createdAt: 1 });

    if (patient) {

        patient.opd = opd.opdNumber;
        patient.status = 'called';
        await patient.save();

        opd.currentPatientId = patient.patientId;
        await opd.save();
        io.emit('queue_update');
        return patient;
    }
    return null;
}

module.exports = { assignNextPatientToOpd };