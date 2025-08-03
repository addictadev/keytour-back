const express = require('express');
const NotificationController = require('../controllers/NotificationAdminController');

const router = express.Router();

// Create notification (can be immediate or scheduled)
router.post('/create', NotificationController.createAdminNotification);

// Get all notifications for a user
router.get('/', NotificationController.getAdminNotifications);

// // Mark a notification as seen
// router.patch('/seen/:notificationId', NotificationController.markAsSeen);

// // Mark all notifications as seen
// router.patch('/seen/all/:userId', NotificationController.markAllAsSeen);

module.exports = router;
