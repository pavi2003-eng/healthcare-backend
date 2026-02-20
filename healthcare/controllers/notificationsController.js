const Notification = require('../models/Notification');
const asyncHandler = require('../../common/utils/asyncHandler');

// GET all notifications for logged-in user
exports.getUserNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.userId })
    .sort({ createdAt: -1 });
  res.json(notifications);
});

// PATCH mark a single notification as read
exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.userId },
    { read: true },
    { new: true }
  );
  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }
  res.json(notification);
});

// PATCH mark all notifications as read
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user.userId, read: false },
    { read: true }
  );
  res.json({ message: 'All notifications marked as read' });
});

// DELETE all read notifications
exports.clearReadNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ userId: req.user.userId, read: true });
  res.json({ message: 'Read notifications cleared' });
});