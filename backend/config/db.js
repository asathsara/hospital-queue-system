const mongoose = require('mongoose');
const Patient = require('../models/Patient'); 

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/hospital-queue', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');

    // Cleanup old patients
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const result = await Patient.deleteMany({ createdAt: { $lt: startOfToday } });
    console.log(`🧹 Deleted ${result.deletedCount} old patient(s)`);

  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
