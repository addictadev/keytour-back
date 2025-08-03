// services/NotificationService.js
const Notification = require('../model/NotificationModel');
const CustomError = require('../utils/customError');

class NotificationService {

  // Create a notification for a user
  async createNotification(userId, title, message) {
    const notification = await Notification.create({ user: userId, title, message });
    return notification;
  }

  // Get all notifications for a user
  async getNotifications(userId) {
    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
    return notifications;
  }

  // Mark a specific notification as seen
  async markAsSeen(notificationId) {
    const notification = await Notification.findById(notificationId);
    if (!notification) throw new CustomError('Notification not found', 404);
    
    notification.seen = true;
    await notification.save();
    
    return notification;
  }

  // Mark all notifications for a user as seen
  async markAllAsSeen(userId) {
    await Notification.updateMany({ user: userId, seen: false }, { seen: true });
  }
}

module.exports = new NotificationService();
