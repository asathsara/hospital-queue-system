const mongoose = require('mongoose');

const opdSchema = new mongoose.Schema({
  opdNumber: Number,
  currentNumber: Number
});

module.exports = mongoose.model('Opd', opdSchema);
