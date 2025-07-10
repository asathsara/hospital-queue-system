const mongoose = require('mongoose');

const opdSchema = new mongoose.Schema({
  opdNumber: Number,
  doctorName: String,
  isAssigned: { type: Boolean, default: false },
  currentPatientId: String
});

module.exports = mongoose.model('Opd', opdSchema);
