const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['appointment_booked', 'appointment_accepted', 'appointment_rescheduled', 'general'],
    default: 'general'
  },
  read: { type: Boolean, default: false },
  link: { type: String }, // optional link to relevant page
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);