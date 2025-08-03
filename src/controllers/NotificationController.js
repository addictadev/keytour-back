// controllers/NotificationController.js
const NotificationService = require('../services/NotificationService');
const response = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

class NotificationController {

  // Create a new notification
  createNotification = catchAsync(async (req, res, next) => {
    const { userId, title, message } = req.body;
    const notification = await NotificationService.createNotification(userId, title, message);
    response(res, 201, notification, 'Notification created successfully');
  });

  // Get all notifications for a user
  getUserNotifications = catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const notifications = await NotificationService.getNotifications(userId);
    response(res, 200, notifications, 'Notifications retrieved successfully');
  });

  // Mark a notification as seen
  markAsSeen = catchAsync(async (req, res, next) => {
    const { notificationId } = req.params;
    const notification = await NotificationService.markAsSeen(notificationId);
    response(res, 200, notification, 'Notification marked as seen');
  });

  // Mark all notifications as seen
  markAllAsSeen = catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    await NotificationService.markAllAsSeen(userId);
    response(res, 200, null, 'All notifications marked as seen');
  });
}

module.exports = new NotificationController();
