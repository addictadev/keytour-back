const NotificationService = require('../services/NotificationAdminService');
const response = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

class NotificationController {

  // Create an admin notification (immediate or scheduled)
  createAdminNotification = catchAsync(async (req, res, next) => {
    const { title, message, scheduledTime } = req.body;
    console.log("object")
    const notification = await NotificationService.createAdminNotification(
      title, 
      message, 
      scheduledTime ? new Date(scheduledTime) : null
    );
    response(res, 201, notification, 'Admin Notification created successfully');
  });

  // Create a vendor notification (immediate or scheduled)
  createVendorNotification = catchAsync(async (req, res, next) => {
    const { userId, title, message, scheduledTime } = req.body;
    const notification = await NotificationService.createVendorNotification(
      title, 
      message, 
      scheduledTime ? new Date(scheduledTime) : null
    );
    response(res, 201, notification, 'Vendor Notification created successfully');
  });

  // Get all notifications for an admin
  getAdminNotifications = catchAsync(async (req, res, next) => {
    
    const notifications = await NotificationService.getAdminNotifications();
    response(res, 200, notifications, 'Admin Notifications retrieved successfully');
  });

  // Get all notifications for a vendor
  getVendorNotifications = catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const notifications = await NotificationService.getVendorNotifications(userId);
    response(res, 200, notifications, 'Vendor Notifications retrieved successfully');
  });

  // Mark an admin notification as seen
  markAdminAsSeen = catchAsync(async (req, res, next) => {
    const { notificationId } = req.params;
    const notification = await NotificationService.markAsSeen(notificationId, 'admin');
    response(res, 200, notification, 'Admin Notification marked as seen');
  });

  // Mark a vendor notification as seen
  markVendorAsSeen = catchAsync(async (req, res, next) => {
    const { notificationId } = req.params;
    const notification = await NotificationService.markAsSeen(notificationId, 'vendor');
    response(res, 200, notification, 'Vendor Notification marked as seen');
  });

  // Mark all admin notifications as seen
  markAllAdminAsSeen = catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    await NotificationService.markAllAsSeen(userId, 'admin');
    response(res, 200, null, 'All Admin Notifications marked as seen');
  });

  // Mark all vendor notifications as seen
  markAllVendorAsSeen = catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    await NotificationService.markAllAsSeen(userId, 'vendor');
    response(res, 200, null, 'All Vendor Notifications marked as seen');
  });
}

module.exports = new NotificationController();
