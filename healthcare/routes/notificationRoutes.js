const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationsController');
const auth = require('../../common/middleware/auth');

router.get('/', auth, notificationController.getUserNotifications);
router.patch('/:id/read', auth, notificationController.markAsRead);
router.patch('/read-all', auth, notificationController.markAllAsRead);
router.delete('/clear', auth, notificationController.clearReadNotifications);

module.exports = router;