const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationsController');
const auth = require('../../common/middleware/auth');

// GET all notifications for logged‑in user
router.get('/', auth, notificationController.getUserNotifications);

// PATCH mark a single notification as read
router.patch('/:id/read', auth, notificationController.markAsRead);

// PATCH mark all notifications as read
router.patch('/read-all', auth, notificationController.markAllAsRead);

// DELETE all read notifications
router.delete('/clear', auth, notificationController.clearReadNotifications);

module.exports = router;