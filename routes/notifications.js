const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Get all notifications for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark a single notification as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all notifications as read
router.patch('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.userId, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete all read notifications (clear)
router.delete('/clear', auth, async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.userId, read: true });
    res.json({ message: 'Read notifications cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;