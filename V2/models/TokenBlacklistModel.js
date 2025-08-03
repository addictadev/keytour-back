/**
 * Token Blacklist Model - For invalidated JWT tokens
 * 
 * Features:
 * - JWT token invalidation
 * - Automatic cleanup of expired tokens
 * - Reason tracking for security audits
 * 
 * @author Expert Backend Developer
 * @version 2.0.0
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const tokenBlacklistSchema = new mongoose.Schema({
    // Token Information
    tokenHash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    jti: { // JWT ID for tracking specific tokens
        type: String,
        required: true,
        index: true
    },
    
    // User Information
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    userType: {
        type: String,
        required: true,
        enum: ['staff', 'admin', 'vendor', 'user']
    },
    
    // Expiration (should match original token expiration)
    expiresAt: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 } // MongoDB TTL index
    },
    
    // Blacklist Reason
    reason: {
        type: String,
        required: true,
        enum: [
            'logout', 
            'password_change', 
            'role_change', 
            'account_suspended', 
            'security_breach', 
            'admin_action',
            'permission_revoked'
        ]
    },
    
    // Device/Session Information
    deviceInfo: {
        userAgent: String,
        ip: String,
        deviceId: String
    },
    
    // Audit Information
    blacklistedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    notes: {
        type: String,
        maxlength: 500
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound indexes for performance
tokenBlacklistSchema.index({ userId: 1, userType: 1 });
tokenBlacklistSchema.index({ tokenHash: 1, expiresAt: 1 });
tokenBlacklistSchema.index({ reason: 1, createdAt: -1 });

// Static method to hash token
tokenBlacklistSchema.statics.hashToken = function(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
};

// Static method to blacklist token
tokenBlacklistSchema.statics.blacklistToken = async function(tokenData) {
    const {
        token,
        jti,
        userId,
        userType,
        expiresAt,
        reason,
        deviceInfo = {},
        blacklistedBy = null,
        notes = ''
    } = tokenData;
    
    const tokenHash = this.hashToken(token);
    
    // Create blacklist entry
    return this.create({
        tokenHash,
        jti,
        userId,
        userType,
        expiresAt,
        reason,
        deviceInfo,
        blacklistedBy,
        notes
    });
};

// Static method to check if token is blacklisted
tokenBlacklistSchema.statics.isTokenBlacklisted = async function(token) {
    const tokenHash = this.hashToken(token);
    const blacklistedToken = await this.findOne({
        tokenHash,
        expiresAt: { $gt: new Date() }
    });
    
    return !!blacklistedToken;
};

// Static method to blacklist all tokens for user
tokenBlacklistSchema.statics.blacklistAllForUser = async function(userId, userType, reason = 'security_breach', blacklistedBy = null) {
    // Note: This method requires you to have the actual tokens to blacklist them
    // In practice, you might want to implement this differently based on your JWT structure
    // For now, we'll mark a special entry indicating all tokens for this user are invalid
    
    return this.create({
        tokenHash: `ALL_TOKENS_${userId}_${Date.now()}`,
        jti: `ALL_${userId}`,
        userId,
        userType,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        reason,
        blacklistedBy,
        notes: 'All tokens invalidated for user'
    });
};

// Static method to cleanup expired blacklist entries
tokenBlacklistSchema.statics.cleanupExpiredTokens = function() {
    return this.deleteMany({
        expiresAt: { $lt: new Date() }
    });
};

// Static method to get blacklist statistics
tokenBlacklistSchema.statics.getBlacklistStats = function(startDate, endDate) {
    const pipeline = [
        {
            $match: {
                createdAt: {
                    $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    $lte: endDate || new Date()
                }
            }
        },
        {
            $group: {
                _id: '$reason',
                count: { $sum: 1 },
                users: { $addToSet: '$userId' }
            }
        },
        {
            $project: {
                reason: '$_id',
                count: 1,
                uniqueUsers: { $size: '$users' },
                _id: 0
            }
        }
    ];
    
    return this.aggregate(pipeline);
};

const TokenBlacklist = mongoose.model('TokenBlacklist', tokenBlacklistSchema);

module.exports = TokenBlacklist;