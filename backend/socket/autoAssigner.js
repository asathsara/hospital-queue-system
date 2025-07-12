const Opd = require('../models/Opd');
const Patient = require('../models/Patient');

async function assignNextPatientToOpd(opdNumber, io) {

    // Find the OPD that is assigned and has no current patient
    const opd = await Opd.findOne({ opdNumber, isAssigned: true, currentPatientId: null });
    if (!opd) return null;

    // Find the next patient in the queue who is waiting and has no OPD assigned
    // Sort by createdAt to get the oldest waiting patient
    const patient = await Patient.findOne({ opd: null, status: 'waiting' }).sort({ createdAt: 1 });

    if (patient) {

        // Assign the patient to the OPD
        patient.opd = opd.opdNumber;
        patient.status = 'called';
        await patient.save();

        // Update the OPD with the current patient
        opd.currentPatientId = patient.patientId;
        await opd.save();

        
        return patient;
    }
    return null;
}

module.exports = { assignNextPatientToOpd };