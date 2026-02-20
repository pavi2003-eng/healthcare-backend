const { getDatabaseConnection } = require('../../common/config/db');
const mongoose = require('mongoose');

const conn = getDatabaseConnection('healthcare');

const patientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  age: Number,
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  bloodPressure: Number,
  glucoseLevel: Number,
  heartRate: Number,
  createdAt: { type: Date, default: Date.now }
});

patientSchema.virtual('priority').get(function() {
  if (this.bloodPressure > 140 || this.glucoseLevel > 140) return 'High';
  if (this.bloodPressure > 120 || this.glucoseLevel > 100) return 'Moderate';
  return 'Low';
});

patientSchema.set('toJSON', { virtuals: true });

module.exports = conn.model('Patient', patientSchema);