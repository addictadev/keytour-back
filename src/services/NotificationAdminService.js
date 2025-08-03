const AdminNotification = require('../model/AdminNotificationModel');
const VendorNotification = require('../model/VendorNotificationModel');
const Notification = require('../model/NotificationModel');
const moment = require('moment');
const cron = require('node-cron');
// const { sendNotification } = require('../utils/notificationUtils'); // Helper to send notification
const User = require('../model/UserModel'); // Import the User model
const admin = require('../../firebase/firebaseAdmin');

class NotificationService {
  // for (const tokenBatch of tokenBatches) {
  //   const notificationPayload = {
  //     notification: {
  //       title,
  //       body: message,
  //       sound: 'default',
  //       badge: '1',
  //       click_action: 'FLUTTER_NOTIFICATION_CLICK'
  //     },
  //     data: {
  //       type: 'admin_notification',
  //       title,
  //       message,
  //       timestamp: new Date().toISOString()
  //     },
  //     android: {
  //       priority: 'high',
  //       notification: {
  //         sound: 'default',
  //         priority: 'high',
  //         channelId: 'admin_notifications'
  //       }
  //     },
  //     apns: {
  //       payload: {
  //         aps: {
  //           sound: 'default',
  //           badge: 1
  //         }
  //       }
  //     }
  //   };

  //   const message = {
  //     tokens: tokenBatch,
  //     ...notificationPayload
  //   };

  //   const response = await admin.messaging().sendEachForMulticast(message);

  //   // Update notification statuses based on response
  //   response.responses.forEach((resp, index) => {
  //     if (!resp.success) {
  //       console.error(`Failed to send notification to token ${tokenBatch[index]}: ${resp.error}`);
  //     }
  //   });
  // }
  // Create a notification for admin
  async createAdminNotification(title, message, scheduledTime=null ) {
    try {
      // Create notification entry in the database
      // const paymentOpenDate = moment().add(2, 'minutes');
      const notificationAdmin = await AdminNotification.create({ title, message, scheduledTime });
  //  console.log(paymentOpenDate)
   

      // If a scheduled time is provided, schedule the notification
      if (scheduledTime) {
       
        // Find all logged-in users with valid FCM tokens

  
        // Prepare the notification payload for FCM
        // const notification = {
        //   tokens: tokens, // Array of FCM tokens
        //   notification: { title, body: message }
        // };
  
        // Send the notification via FCM to all users
  
        // Save the notification for each user in the database
        const scheduledTimee = moment(scheduledTime);
        // Convert scheduled time to a cron expression
        // const minute = scheduledTime.getMinutes();
        // const hour = scheduledTime.getHours();
        // const dayOfMonth = scheduledTime.getDate();
        // const month = scheduledTime.getMonth() + 1; // months are 0-indexed in JavaScript
        // const cronExpression = `${minute} ${hour} ${dayOfMonth} ${month} *`;
  const cronExpression = `${scheduledTimee.minute()} ${scheduledTimee.hour()} ${scheduledTimee.date()} ${scheduledTimee.month() + 1} *`;

        console.log(cronExpression)

        // Schedule the notification using cron
        cron.schedule(cronExpression, async () => {
          try {
            const users = await User.find({ isLogin: true, fcmtoken: { $ne: null } });
            const tokens = users.map(user => user.fcmtoken);
            const notificationPromises = users.map(user => {
              const userNotification = new Notification({
                user: user._id,
                title,
                message,
                type: 'admin',
              });
              return userNotification.save();
            });
            await Promise.all(notificationPromises);
            // Send the notification when the cron job triggers
            const notificationToSend = {
              tokens: tokens,
              notification: { title, body: message }
            };
            await admin.messaging().sendEachForMulticast(notificationToSend);

            // After sending, log success
            console.log(`Notification sent at ${moment().format('YYYY-MM-DD HH:mm:ss')}`);

            // After sending, mark it as sent (no actual cronJobId used here)
          } catch (error) {
            console.error("Error while scheduling notification:", error);
          }
        });

      } else {
      
        // Find all logged-in users with valid FCM tokens
        const users = await User.find({ isLogin: true, fcmtoken: { $ne: null } });
        const tokens = users.map(user => user.fcmtoken);


  
        // Save the notification for each user in the database
        const notificationPromises = users.map(user => {
          const userNotification = new Notification({
            user: user._id,
            title,
            message,
            type: 'admin',
          });
          return userNotification.save();
        });
        await Promise.all(notificationPromises);

        // Send the notification immediately (no scheduling)
        const notificationToSend = {
          tokens: tokens,
          notification: { title, body: message }
        };
        await admin.messaging().sendEachForMulticast(notificationToSend);
      }

      // Return the created admin notification
      return notificationAdmin;

    } catch (error) {
      console.error('Error creating admin notification:', error);
      throw error;  // Re-throw error after logging
    }
  }






  async saveNotificationsForUsers(users, title, message, type) {
    const notificationPromises = users.map(user => {
        const notification = new Notification({
            user: user._id,
            title,
            message,
            type,
        });
        return notification.save();
    });

    await Promise.all(notificationPromises);
}



































  // Create a notification for vendor
  async createVendorNotification(userId, title, message, scheduledTime = null) {
    const notification = await VendorNotification.create({ user: userId, title, message, scheduledTime });

    if (scheduledTime) {
      // Schedule the notification if a scheduled time is provided
      this.scheduleNotification(notification, 'vendor');
    } else {
      // Send the notification immediately
      this.sendImmediateNotification(notification, 'vendor');
    }
    
    return notification;
  }

  // Send notification immediately
  sendImmediateNotification(notification, type) {
    sendNotification(notification.user, notification.title, notification.message, type);
  }

  // Schedule notification
  scheduleNotification(notification, type) {
    const cronExpression = this.getCronExpression(notification.scheduledTime);
    
    // Schedule a cron job for future notifications
    const cronJob = cron.schedule(cronExpression, async () => {
      try {
        // Send notification when the cron job triggers
        this.sendImmediateNotification(notification, type);
        
        // After sending, mark it as sent
        notification.cronJobId = cronJob.name;
        await notification.save();

      } catch (error) {
        console.error("Error while scheduling notification:", error);
      }
    });

    notification.cronJobId = cronJob.name;  // Store cron job ID
    notification.save();
  }

  // Convert scheduled time to a cron expression
  getCronExpression(scheduledTime) {
    const minute = scheduledTime.getMinutes();
    const hour = scheduledTime.getHours();
    const dayOfMonth = scheduledTime.getDate();
    const month = scheduledTime.getMonth() + 1; // months are 0-indexed in JavaScript

    return `${minute} ${hour} ${dayOfMonth} ${month} *`;
  }

  // Get all notifications for an admin
  async getAdminNotifications() {
    const notifications = await AdminNotification.find().sort({ createdAt: -1 });
    return notifications;
  }

  // Get all notifications for a vendor
  async getVendorNotifications(userId) {
    const notifications = await VendorNotification.find({ user: userId }).sort({ createdAt: -1 });
    return notifications;
  }

  // Mark a specific notification as seen
  async markAsSeen(notificationId, type) {
    let notification;
    if (type === 'admin') {
      notification = await AdminNotification.findById(notificationId);
    } else if (type === 'vendor') {
      notification = await VendorNotification.findById(notificationId);
    }

    if (!notification) throw new Error('Notification not found');
    
    notification.seen = true;
    await notification.save();
    
    return notification;
  }

  // Mark all notifications for a user as seen
  async markAllAsSeen(userId, type) {
    let notifications;
    if (type === 'admin') {
      notifications = await AdminNotification.updateMany({ user: userId, seen: false }, { seen: true });
    } else if (type === 'vendor') {
      notifications = await VendorNotification.updateMany({ user: userId, seen: false }, { seen: true });
    }
    return notifications;
  }
}

module.exports = new NotificationService();
