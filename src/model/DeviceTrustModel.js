const mongoose = require('mongoose');

const deviceTrustSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true,
        index: true 
    },
    userType: {
        type: String,
        enum: ['user', 'admin', 'vendor'],
        required: true
    },
    deviceFingerprint: { 
        type: String, 
        required: true,
        index: true 
    },
    deviceInfo: {
        browser: String,
        browserVersion: String,
        os: String,
        osVersion: String,
        device: String,
        userAgent: String,
        ip: String,
        location: {
            country: String,
            city: String,
            region: String,
            timezone: String,
            coordinates: {
                lat: Number,
                lng: Number
            }
        }
    },
    trustLevel: {
        type: String,
        enum: ['trusted', 'suspicious', 'blocked'],
        default: 'suspicious'
    },
    lastUsed: { 
        type: Date, 
        default: Date.now 
    },
    firstSeen: { 
        type: Date, 
        default: Date.now 
    },
    loginCount: { 
        type: Number, 
        default: 1 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    // Trust expiry - devices need re-verification after this period
    trustExpiresAt: {
        type: Date,
        default: function() {
            return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        }
    },
    // Security tracking
    suspiciousActivities: [{
        activity: String,
        timestamp: Date,
        details: mongoose.Schema.Types.Mixed
    }],
    created_at: { 
        type: Date, 
        default: Date.now 
    },
    updated_at: { 
        type: Date, 
        default: Date.now 
    }
});

// Compound index for unique device per user
deviceTrustSchema.index({ userId: 1, deviceFingerprint: 1 }, { unique: true });
deviceTrustSchema.index({ trustExpiresAt: 1 }); // For cleanup queries
deviceTrustSchema.index({ lastUsed: 1 }); // For activity queries

// Update timestamp on save
deviceTrustSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

// Instance methods
deviceTrustSchema.methods.markAsTrusted = function() {
    this.trustLevel = 'trusted';
    this.trustExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Extend trust for 30 days
    this.lastUsed = Date.now();
    this.loginCount += 1;
    return this.save();
};

deviceTrustSchema.methods.markAsSuspicious = function(reason) {
    this.trustLevel = 'suspicious';
    this.suspiciousActivities.push({
        activity: reason,
        timestamp: new Date(),
        details: { previousTrustLevel: this.trustLevel }
    });
    return this.save();
};

deviceTrustSchema.methods.block = function(reason) {
    this.trustLevel = 'blocked';
    this.isActive = false;
    this.suspiciousActivities.push({
        activity: 'Device blocked: ' + reason,
        timestamp: new Date()
    });
    return this.save();
};

deviceTrustSchema.methods.updateActivity = function() {
    this.lastUsed = Date.now();
    this.loginCount += 1;
    return this.save();
};

// Static methods
deviceTrustSchema.statics.findTrustedDevice = async function(userId, deviceFingerprint) {
    return await this.findOne({
        userId,
        deviceFingerprint,
        trustLevel: 'trusted',
        isActive: true,
        trustExpiresAt: { $gt: new Date() }
    });
};

deviceTrustSchema.statics.cleanupExpiredDevices = async function() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    return await this.deleteMany({
        $or: [
            { trustExpiresAt: { $lt: new Date() } },
            { lastUsed: { $lt: thirtyDaysAgo } }
        ]
    });
};

const DeviceTrust = mongoose.model('DeviceTrust', deviceTrustSchema);

module.exports = DeviceTrust;