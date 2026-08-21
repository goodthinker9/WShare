const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');

// Get user notifications
router.get(
  '/',
  authenticate,
  notificationController.getNotifications
);

// Get unread count
router.get(
  '/unread-count',
  authenticate,
  notificationController.getUnreadCount
);

// Mark notification as read
router.put(
  '/:id/read',
  authenticate,
  notificationController.markAsRead
);

// Mark all notifications as read
router.put(
  '/read-all',
  authenticate,
  notificationController.markAllAsRead
);

module.exports = router;

