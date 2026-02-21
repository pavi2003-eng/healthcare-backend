const { getDatabaseConnection } = require('../../common/config/db');
const mongoose = require('mongoose');

const conn = getDatabaseConnection('healthcare');

const chatSchema = new mongoose.Schema({
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: true,
    index: true 
  },
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true,
    index: true 
  },
  doctorName: { type: String, required: true },
  patientName: { type: String, required: true },
  subject: { type: String, required: true },
  appointmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Appointment' 
  },
  lastMessageAt: { type: Date, default: Date.now },
  lastReadByDoctor: { type: Date, default: Date.now },
  lastReadByPatient: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

chatSchema.index({ doctorId: 1, patientId: 1 }, { unique: true });

module.exports = conn.model('Chat', chatSchema);