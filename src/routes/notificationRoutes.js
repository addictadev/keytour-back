// routes/notificationRoutes.js
const express = require('express');
const NotificationController = require('../controllers/NotificationController');
const router = express.Router();

// Create a new notification
router.post('/create', NotificationController.createNotification);

// Get all notifications for a user
router.get('/user/:userId', NotificationController.getUserNotifications);

// Mark a notification as seen
router.patch('/:notificationId/seen', NotificationController.markAsSeen);

// Mark all notifications as seen
router.patch('/user/:userId/mark-all-seen', NotificationController.markAllAsSeen);

module.exports = router;
