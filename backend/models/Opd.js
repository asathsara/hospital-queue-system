const mongoose = require('mongoose');

const opdSchema = new mongoose.Schema({
  opdNumber: Number,
  doctorName: String,
  isAssigned: { type: Boolean, default: false },
  currentNumber: Number
});

module.exports = mongoose.model('Opd', opdSchema);
