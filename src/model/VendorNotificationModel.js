const mongoose = require('mongoose');

const vendorNotificationSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  seen: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  scheduledTime: {
    type: Date,  // Time when the notification is scheduled to be sent
  },
  cronJobId: {
    type: String, // ID to track the scheduled cron job
  }
});

const VendorNotification = mongoose.model('VendorNotification', vendorNotificationSchema);

module.exports = VendorNotification;
