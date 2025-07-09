const Opd = require('../models/Opd');
const Patient = require('../models/Patient');

module.exports = (io, socket, activeOPDs) => {

  // Doctor gets available OPDs
  socket.on('get_available_opds', async () => {
    const available = await Opd.find({ isAssigned: false });
    socket.emit('available_opds', available);
  });

  // Doctor selects an OPD
  socket.on('select_opd', async (opdNumber) => {
    const opd = await Opd.findOne({ opdNumber, isAssigned: false });
    if (!opd) {
      socket.emit('opd_error', 'OPD not available');
      return;
    }
    opd.isAssigned = true;
    await opd.save();

    activeOPDs.set(socket.id, opdNumber);
    socket.emit('opd_assigned', opdNumber);
    io.emit('opd_list_updated');
  });

  // Add OPD (from Admin)
  socket.on('add_opd', async ({ opdNumber, doctorName }) => {
    try {
      const opd = await Opd.create({ opdNumber, doctorName, isAssigned: false });
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

  // Delete OPD
  socket.on('delete_opd', async (opdId) => {
    try {
      await Opd.deleteOne({ _id: opdId });
      io.emit('opd_list_updated');
    } catch (err) {
      console.error('Error deleting OPD:', err);
      socket.emit('opd_error', 'Failed to delete OPD');
    }
  });

  // Doctor calls next patient
  socket.on('next_patient', async (opdNumber) => {
    try {
      const patient = await Patient.findOneAndUpdate(
        { opd: opdNumber, status: 'waiting' },
        { status: 'called' },
        { sort: { number: 1 }, new: true }
      );

      if (patient) {
        await Opd.findOneAndUpdate(
          { opdNumber },
          { currentNumber: patient.number },
          { upsert: true }
        );

        socket.emit('patient_called', patient);
        io.emit('queue_update');
      } else {
        socket.emit('patient_called', null);
      }
    } catch (err) {
      console.error('Error calling next patient:', err);
      socket.emit('error', 'Failed to call next patient');
    }
  });

  // Handle disconnect for doctors
  socket.on('disconnect', async () => {
    if (activeOPDs.has(socket.id)) {
      const opdNumber = activeOPDs.get(socket.id);
      await Opd.findOneAndUpdate({ opdNumber }, { isAssigned: false });
      activeOPDs.delete(socket.id);
      io.emit('opd_list_updated');
      console.log(`Doctor disconnected, OPD ${opdNumber} freed`);
    }
  });
};
