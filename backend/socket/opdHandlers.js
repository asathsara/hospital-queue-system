const Opd = require('../models/Opd');
const Patient = require('../models/Patient');
const { assignNextPatientToOpd } = require('./autoAssigner');

module.exports = (io, socket, activeOPDs) => {

  // Doctor gets available OPDs
  socket.on('get_available_opds', async () => {

    const available = await Opd.find({ isAssigned: false });
    socket.emit('available_opds', available);
  });

  // Doctor selects an OPD
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
    socket.emit('patient_called', patient);

    socket.emit('opd_assigned', opdNumber);
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

      socket.emit('opd_added', opd);
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
      socket.emit('opds_list', opds);

    } catch (err) {
      console.error('Error fetching OPDs:', err);
      socket.emit('opd_error', 'Failed to fetch OPDs');
    }
  });

  // Reusable function to unassign OPD
  async function unassignOpdById(opdId) {
    const opd = await Opd.findById(opdId);
    if (!opd) return null;
    opd.isAssigned = false;
    opd.currentPatientId = null;
    await opd.save();
    io.emit('opd_list_updated');
    io.emit('opd_unassigned', opd);
    return opd;
  }

  // Delete OPD
  socket.on('delete_opd', async (opdId) => {
    try {
      // Unassign OPD after deletion 
      await unassignOpdById(opdId);
      await Opd.deleteOne({ _id: opdId });
    
    } catch (err) {
      console.error('Error deleting OPD:', err);
      socket.emit('opd_error', 'Failed to delete OPD');
    }
  });

  // Doctor calls next patient
  socket.on('next_patient', async (opdNumber) => {
    try {
      // Mark current patient as done
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
      socket.emit('patient_called', patient);

      io.emit('queue_update');

    } catch (err) {
      console.error('Error calling next patient:', err);
      socket.emit('error', 'Failed to call next patient');
    }
  });

  // Manual OPD release (on browser close/reload)
  socket.on('opd_release', async (opdNumber) => {
    // Mark current patient as done if exists
    const opd = await Opd.findOne({ opdNumber });
    if (opd && opd.currentNumber) {
      await Patient.findOneAndUpdate(
        { opd: opdNumber, number: opd.currentNumber, status: 'called' },
        { status: 'done' }
      );
      opd.currentNumber = null;
      await opd.save();
    }
    await Opd.findOneAndUpdate({ opdNumber }, { isAssigned: false });
    activeOPDs.delete(socket.id);
    io.emit('opd_list_updated');
    io.emit('queue_update');
    console.log(`OPD ${opdNumber} released by manual event`);
  });

  // Handle disconnect for doctors
  socket.on('disconnect', async () => {
    if (activeOPDs.has(socket.id)) {
      const opdNumber = activeOPDs.get(socket.id);
      // Mark current patient as done if exists
      const opd = await Opd.findOne({ opdNumber });
      if (opd && opd.currentNumber) {
        await Patient.findOneAndUpdate(
          { opd: opdNumber, number: opd.currentNumber, status: 'called' },
          { status: 'done' }
        );
        opd.currentNumber = null;
        await opd.save();
      }
      await Opd.findOneAndUpdate({ opdNumber }, { isAssigned: false });
      activeOPDs.delete(socket.id);
      io.emit('opd_list_updated');
      io.emit('queue_update');
      console.log(`Doctor disconnected, OPD ${opdNumber} freed`);
    }
  });

  // Get current patient
  socket.on('get_current_patient', async (opdNumber) => {
    const opd = await Opd.findOne({ opdNumber });
    if (!opd || !opd.currentPatientId) {
      socket.emit('current_patient', null);
      return;
    }
    const patient = await Patient.findOne({ patientId: opd.currentPatientId });
    socket.emit('current_patient', patient);
  });

  // Unassign OPD
  socket.on('unassign_opd', async (opdId) => {
    try {
      const opd = await unassignOpdById(opdId);
      if (!opd) {
        socket.emit('opd_error', 'OPD not found');
      }
    } catch (err) {
      console.error('Error unassigning OPD:', err);
      socket.emit('opd_error', 'Failed to unassign OPD');
    }
  });
};


