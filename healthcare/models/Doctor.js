const { getDatabaseConnection } = require('../../common/config/db');
const mongoose = require('mongoose');

const conn = getDatabaseConnection('healthcare');

const doctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  mobileNumber: { type: String, required: true }, 
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  specialization: String,
  specialist: [String], 
  experience: Number,
  consultationFee: Number,
  availableDays: [String],
  availableTime: String,
  designation: String,
  contactNumber: String, 
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Add index for mobile number
doctorSchema.index({ mobileNumber: 1 });

module.exports = conn.model('Doctor', doctorSchema);