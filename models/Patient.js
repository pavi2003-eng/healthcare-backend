const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  age: { type: Number },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  bloodPressure: { type: Number },
  glucoseLevel: { type: Number },
  heartRate: { type: Number },
  createdAt: { type: Date, default: Date.now }
});
patientSchema.virtual('priority').get(function() {
  if (this.bloodPressure > 140 || this.glucoseLevel > 140) return 'High';
  if (this.bloodPressure > 120 || this.glucoseLevel > 100) return 'Moderate';
  return 'Low';
});

// Ensure virtuals are included in toJSON
patientSchema.set('toJSON', { virtuals: true });
patientSchema.set('toObject', { virtuals: true });
module.exports = mongoose.model('Patient', patientSchema);