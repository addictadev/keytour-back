/**
 * Refresh Token Model - For secure token management
 * 
 * Features:
 * - Secure refresh token storage
 * - Automatic expiration
 * - Device/session tracking
 * - Token rotation support
 * 
 * @author Expert Backend Developer
 * @version 2.0.0
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const refreshTokenSchema = new mongoose.Schema({
    // Token Information
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    hashedToken: {
        type: String,
        required: true,
        index: true
    },
    
    // User Reference
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    userType: {
        type: String,
        required: true,
        enum: ['staff', 'admin', 'vendor', 'user'],
        index: true
    },
    
    // Expiration
    expiresAt: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 } // MongoDB TTL index
    },
    
    // Session Information
    deviceInfo: {
        userAgent: String,
        ip: String,
        deviceId: String,
        platform: String,
        browser: String
    },
    
    // Security
    isRevoked: {
        type: Boolean,
        default: false,
        index: true
    },
    revokedAt: {
        type: Date
    },
    revokedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    revokedReason: {
        type: String,
        enum: ['logout', 'security', 'admin_action', 'expired', 'rotation']
    },
    
    // Usage Tracking
    lastUsed: {
        type: Date,
        default: Date.now
    },
    usageCount: {
        type: Number,
        default: 0
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound indexes for performance
refreshTokenSchema.index({ userId: 1, userType: 1 });
refreshTokenSchema.index({ hashedToken: 1, isRevoked: 1 });
refreshTokenSchema.index({ expiresAt: 1, isRevoked: 1 });

// Static method to generate refresh token
refreshTokenSchema.statics.generateToken = function() {
    return crypto.randomBytes(40).toString('hex');
};

// Static method to hash token
refreshTokenSchema.statics.hashToken = function(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
};

// Static method to create refresh token
refreshTokenSchema.statics.createRefreshToken = async function(userId, userType, deviceInfo = {}) {
    const token = this.generateToken();
    const hashedToken = this.hashToken(token);
    
    // Set expiration (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    const refreshToken = await this.create({
        token,
        hashedToken,
        userId,
        userType,
        expiresAt,
        deviceInfo
    });
    
    return { token, refreshToken };
};

// Instance method to revoke token
refreshTokenSchema.methods.revoke = function(reason = 'logout', revokedBy = null) {
    this.isRevoked = true;
    this.revokedAt = new Date();
    this.revokedReason = reason;
    if (revokedBy) {
        this.revokedBy = revokedBy;
    }
    return this.save();
};

// Instance method to update usage
refreshTokenSchema.methods.updateUsage = function() {
    this.lastUsed = new Date();
    this.usageCount += 1;
    return this.save();
};

// Static method to find valid token
refreshTokenSchema.statics.findValidToken = function(token) {
    const hashedToken = this.hashToken(token);
    return this.findOne({
        hashedToken,
        isRevoked: false,
        expiresAt: { $gt: new Date() }
    });
};

// Static method to revoke all tokens for user
refreshTokenSchema.statics.revokeAllForUser = function(userId, userType, reason = 'security') {
    return this.updateMany(
        { userId, userType, isRevoked: false },
        {
            $set: {
                isRevoked: true,
                revokedAt: new Date(),
                revokedReason: reason
            }
        }
    );
};

// Static method to cleanup expired tokens
refreshTokenSchema.statics.cleanupExpiredTokens = function() {
    return this.deleteMany({
        $or: [
            { expiresAt: { $lt: new Date() } },
            { isRevoked: true, revokedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // Remove revoked tokens after 7 days
        ]
    });
};

// Transform output (remove sensitive fields)
refreshTokenSchema.methods.toJSON = function() {
    const tokenObj = this.toObject();
    delete tokenObj.token;
    delete tokenObj.hashedToken;
    delete tokenObj.__v;
    return tokenObj;
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;