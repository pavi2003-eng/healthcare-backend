const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  doctorName: { type: String, required: true },
  patientName: { type: String, required: true },
  subject: { type: String, required: true },
  messages: [messageSchema],
  lastUpdated: { type: Date, default: Date.now },
  lastReadByDoctor: { type: Date, default: Date.now },
  lastReadByPatient: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', chatSchema);