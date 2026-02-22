// healthcare/routes/index.js
const express = require('express');
const router = express.Router();
const patientRoutes = require('./patientRoutes');
const doctorRoutes = require('./doctorRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const chatRoutes = require('./chatRoutes'); // Updated
const authRoutes = require('./authRoutes');
const ratingRoutes = require('./ratingRoutes');
const adminRoutes = require('./adminRoutes');
const notificationRoutes = require('./notificationRoutes');
const profileRoutes = require('./profileRoutes');

router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/chats', chatRoutes); // Updated
router.use('/auth', authRoutes);
router.use('/ratings', ratingRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);
router.use('/profile', profileRoutes);

module.exports = router;