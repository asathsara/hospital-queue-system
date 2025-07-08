const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: String,
  nic: String,
  number: Number,
  opd: Number,
  status: { type: String, enum: ['waiting', 'called', 'done'], default: 'waiting' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', patientSchema);
