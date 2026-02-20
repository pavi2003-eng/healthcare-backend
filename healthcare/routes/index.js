const express = require('express');
const router = express.Router();

// Import all sub‑route modules
const patientRoutes = require('./patientRoutes');
const doctorRoutes = require('./doctorRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const chatRoutes = require('./chatRoutes');
const departmentRoutes = require('./departmentRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const authRoutes = require('./authRoutes');
const ratingRoutes = require('./ratingRoutes');
const adminRoutes = require('./adminRoutes');
const notificationRoutes = require('./notificationRoutes');
const profileRoutes = require('./profileRoutes');

// Mount them under respective paths
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/chats', chatRoutes);
router.use('/departments', departmentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/auth', authRoutes);
router.use('/ratings', ratingRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);
router.use('/profile', profileRoutes);

module.exports = router;