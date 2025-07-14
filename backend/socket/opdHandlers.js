const Opd = require('../models/Opd');
const Patient = require('../models/Patient');
const { assignNextPatientToOpd } = require('./autoAssigner');

// Reusable function to unassign OPD
const unassignOpdById = async (opdId, io, activeOPDs) => {

  const opd = await Opd.findById(opdId);

  // unassign OPD only found or assigned
  if (!opd || !opd.isAssigned) return null;

  // unassign OPD 
  opd.isAssigned = false;

  // when assigned OPD has a current patient, mark that patient as done
  if (opd.currentPatientId) {

    // Update the current patient status to 'done'
    await Patient.findOneAndUpdate(
      { patientId: opd.currentPatientId, status: 'called' },
      { status: 'done' }
    );
  }

  // Then clear the current patient in OPD
  opd.currentPatientId = null;
  await opd.save();

  //  5 - Notify only the doctor using this OPD
  for (const [socketId, assignedOpdNumber] of activeOPDs.entries()) {
    if (assignedOpdNumber === opd.opdNumber) {
      io.to(socketId).emit('opd_unassigned', opd);

      // Remove the mapping for this socket
      activeOPDs.delete(socketId);
    }
  }

  return opd;
}


const handlerFunction = (io, socket, activeOPDs) => {

  // 1 - Doctor gets available OPDs
  socket.on('get_available_opds', async () => {

    const available = await Opd.find({ isAssigned: false });
    socket.emit('available_opds', available);
  });

  // 2 - Doctor selects an OPD
  socket.on('select_opd', async (opdNumber) => {

    const opd = await Opd.findOne({ opdNumber, isAssigned: false });

    // If OPD is not available, notify doctor
    if (!opd) {
      socket.emit('opd_error', 'OPD not available');
      return;
    }

    opd.isAssigned = true;

    // update current patient
    await opd.save();

    activeOPDs.set(socket.id, opdNumber);

    // Assign next patient using the shared function
    const patient = await assignNextPatientToOpd(opdNumber, io);

    // 2 - Notify this doctor that OPD is assigned
    socket.emit('opd_assigned', opdNumber);

    // Notify if patient is assigned to this OPD
    if (patient) {

      // 2 - Notify the doctor that a patient is called
      socket.emit('patient_called', patient);
    }

    // 3 - notify display and admin that a doctor has selected an OPD 
    io.emit('opd_list_updated');

  });

  // Add OPD (from Admin)
  socket.on('add_opd', async ({ opdNumber, doctorName }) => {

    try {
      const opd = await Opd.create({
        opdNumber,
        doctorName,
        isAssigned: false,
        currentPatientId: null
      });

      //socket.emit('opd_added', opd);

      // 3 - Notify all doctors, display and opd list that a new OPD is added
      io.emit('opd_list_updated');

    } catch (err) {
      console.error('Failed to add OPD:', err);
      socket.emit('opd_error', 'Failed to add OPD');
    }
  });

  // Get all OPDs
  socket.on('get_opds', async () => {

    try {
      const opds = await Opd.find({});

      // 4 - Emit the list of OPDs to the requesting admin
      socket.emit('opds_list', opds);

    } catch (err) {

      console.error('Error fetching OPDs:', err);
      socket.emit('opd_error', 'Failed to fetch OPDs');
    }
  });



  // Unassign OPD
  socket.on('unassign_opd', async (opdId) => {
    try {

      const opd = await unassignOpdById(opdId, io, activeOPDs);

      // 3 - Notify all doctors, display and opd list that an OPD is unassigned
      io.emit('opd_list_updated');

      if (!opd) {
        socket.emit('opd_error', 'OPD not found');
      }

    } catch (err) {

      console.error('Error unassigning OPD:', err);
      socket.emit('opd_error', 'Failed to unassign OPD');
    }
  });

  // Delete OPD
  socket.on('delete_opd', async (opdId) => {
    try {

      // Unassign OPD first
      await unassignOpdById(opdId, io, activeOPDs);

      // Then delete it
      await Opd.deleteOne({ _id: opdId });

      // Notify clients
      io.emit('opd_list_updated');

    } catch (err) {
      console.error('Error deleting OPD:', err);
      socket.emit('opd_error', 'Failed to delete OPD');
    }
  });

  // 6 - Doctor calls next patient
  socket.on('next_patient', async (opdNumber) => {
    try {

      const opd = await Opd.findOne({ opdNumber });
      if (opd && opd.currentPatientId) {

        // Update the current patient status to 'done'
        await Patient.findOneAndUpdate(
          { patientId: opd.currentPatientId, status: 'called' },
          { status: 'done' }
        );

        // Clear current patient in OPD
        opd.currentPatientId = null;
        await opd.save();
      }

      // Assign next patient using the shared function
      const patient = await assignNextPatientToOpd(opdNumber, io);

      // 2 - Notify the doctor that a patient is called
      socket.emit('patient_called', patient);

      // 7 - Notify all displays and admin that the patient queue is updated
      io.emit('patient_list_updated');

    } catch (err) {
      console.error('Error calling next patient:', err);
      socket.emit('error', 'Failed to call next patient');
    }
  });

  // Handle deleting all OPDs
  socket.on('delete_all_opds', async () => {
    try {
      // Get all OPDs
      const allOpds = await Opd.find({});

      // Unassign each one before deletion
      for (const opd of allOpds) {
        await unassignOpdById(opd._id, io, activeOPDs);
      }

      // Then delete all
      await Opd.deleteMany({});

      // Notify clients
      io.emit('opd_list_updated');

    } catch (err) {
      console.error('Error deleting all OPDs:', err);
      socket.emit('opd_error', 'Failed to delete all OPDs');
    }
  });


};

module.exports = {
  handlerFunction,
  unassignOpdById,
};



