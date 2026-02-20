const { getDatabaseConnection } = require('../../common/config/db');
const mongoose = require('mongoose');

const conn = getDatabaseConnection('healthcare');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['appointment_booked', 'appointment_accepted', 'appointment_rescheduled', 'general'],
    default: 'general'
  },
  read: { type: Boolean, default: false },
  link: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = conn.model('Notification', notificationSchema);