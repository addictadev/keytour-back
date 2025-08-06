const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true,
        index: true
    },
    otp: { 
        type: String, 
        required: true 
    },
    purpose: {
        type: String,
        enum: ['verification', 'login', 'password_reset', 'suspicious_login', 'two_factor'],
        default: 'verification'
    },
    deviceFingerprint: String,
    expiresAt: { 
        type: Date, 
        required: true 
    },
    created_at: { 
        type: Date, 
        default: Date.now 
    }
});

// Indexes for performance and automatic cleanup
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic deletion
otpSchema.index({ userId: 1, expiresAt: -1 }); // For finding active OTPs
otpSchema.index({ created_at: -1 }); // For sorting by creation time

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
