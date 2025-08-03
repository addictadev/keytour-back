/**
 * Token Management Service - Advanced token lifecycle management
 * 
 * Features:
 * - Token cleanup and maintenance
 * - Security monitoring
 * - Token analytics
 * - Automated maintenance tasks
 * - Performance optimization
 * 
 * @author Expert Backend Developer
 * @version 2.0.0
 */

const RefreshToken = require('../models/RefreshTokenModel');
const TokenBlacklist = require('../models/TokenBlacklistModel');
const Staff = require('../models/StaffModel');
const cron = require('node-cron');

class TokenManagementService {
    /**
     * Initialize token management service
     */
    static init() {
        // Schedule cleanup tasks
        this.scheduleCleanupTasks();
        
        // Schedule maintenance tasks
        this.scheduleMaintenanceTasks();
        
        console.log('Token Management Service initialized');
    }

    /**
     * Schedule automatic cleanup tasks
     */
    static scheduleCleanupTasks() {
        // Clean expired tokens every hour
        cron.schedule('0 * * * *', async () => {
            try {
                await this.cleanupExpiredTokens();
                console.log('Scheduled token cleanup completed');
            } catch (error) {
                console.error('Scheduled token cleanup failed:', error);
            }
        });

        // Clean old blacklisted tokens every day at 2 AM
        cron.schedule('0 2 * * *', async () => {
            try {
                await this.cleanupOldBlacklistedTokens();
                console.log('Scheduled blacklist cleanup completed');
            } catch (error) {
                console.error('Scheduled blacklist cleanup failed:', error);
            }
        });
    }

    /**
     * Schedule maintenance tasks
     */
    static scheduleMaintenanceTasks() {
        // Generate token analytics report every week
        cron.schedule('0 3 * * 0', async () => {
            try {
                const analytics = await this.generateTokenAnalytics();
                console.log('Weekly token analytics:', analytics);
            } catch (error) {
                console.error('Token analytics generation failed:', error);
            }
        });

        // Check for suspicious token activity every 6 hours
        cron.schedule('0 */6 * * *', async () => {
            try {
                await this.checkSuspiciousActivity();
                console.log('Suspicious activity check completed');
            } catch (error) {
                console.error('Suspicious activity check failed:', error);
            }
        });
    }

    /**
     * Clean up expired tokens
     */
    static async cleanupExpiredTokens() {
        const results = {
            refreshTokens: 0,
            blacklistedTokens: 0
        };

        // Clean expired refresh tokens
        const refreshTokenResult = await RefreshToken.cleanupExpiredTokens();
        results.refreshTokens = refreshTokenResult.deletedCount || 0;

        // Clean expired blacklisted tokens
        const blacklistResult = await TokenBlacklist.cleanupExpiredTokens();
        results.blacklistedTokens = blacklistResult.deletedCount || 0;

        console.log(`Token cleanup completed: ${results.refreshTokens} refresh tokens, ${results.blacklistedTokens} blacklisted tokens removed`);
        
        return results;
    }

    /**
     * Clean old blacklisted tokens (after 30 days)
     */
    static async cleanupOldBlacklistedTokens() {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const result = await TokenBlacklist.deleteMany({
            createdAt: { $lt: thirtyDaysAgo }
        });

        console.log(`Cleaned up ${result.deletedCount} old blacklisted tokens`);
        return result.deletedCount;
    }

    /**
     * Get token statistics
     */
    static async getTokenStatistics() {
        const [
            totalRefreshTokens,
            activeRefreshTokens,
            expiredRefreshTokens,
            revokedRefreshTokens,
            totalBlacklistedTokens,
            blacklistStats
        ] = await Promise.all([
            RefreshToken.countDocuments({}),
            RefreshToken.countDocuments({ 
                isRevoked: false, 
                expiresAt: { $gt: new Date() } 
            }),
            RefreshToken.countDocuments({ 
                expiresAt: { $lt: new Date() } 
            }),
            RefreshToken.countDocuments({ isRevoked: true }),
            TokenBlacklist.countDocuments({}),
            TokenBlacklist.getBlacklistStats()
        ]);

        return {
            refreshTokens: {
                total: totalRefreshTokens,
                active: activeRefreshTokens,
                expired: expiredRefreshTokens,
                revoked: revokedRefreshTokens
            },
            blacklistedTokens: {
                total: totalBlacklistedTokens,
                byReason: blacklistStats
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generate comprehensive token analytics
     */
    static async generateTokenAnalytics() {
        const now = new Date();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Token creation trends
        const tokenTrends = await RefreshToken.aggregate([
            {
                $match: { createdAt: { $gte: lastMonth } }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            }
        ]);

        // Device distribution
        const deviceStats = await RefreshToken.aggregate([
            {
                $match: { 
                    createdAt: { $gte: lastWeek },
                    isRevoked: false
                }
            },
            {
                $group: {
                    _id: '$deviceInfo.platform',
                    count: { $sum: 1 },
                    uniqueUsers: { $addToSet: '$userId' }
                }
            },
            {
                $project: {
                    platform: '$_id',
                    count: 1,
                    uniqueUsers: { $size: '$uniqueUsers' },
                    _id: 0
                }
            }
        ]);

        // Token usage patterns
        const usagePatterns = await RefreshToken.aggregate([
            {
                $match: { 
                    lastUsed: { $gte: lastWeek },
                    isRevoked: false
                }
            },
            {
                $group: {
                    _id: null,
                    avgUsageCount: { $avg: '$usageCount' },
                    maxUsageCount: { $max: '$usageCount' },
                    totalUsage: { $sum: '$usageCount' }
                }
            }
        ]);

        // Security incidents
        const securityIncidents = await TokenBlacklist.aggregate([
            {
                $match: { createdAt: { $gte: lastWeek } }
            },
            {
                $group: {
                    _id: '$reason',
                    count: { $sum: 1 },
                    uniqueUsers: { $addToSet: '$userId' }
                }
            },
            {
                $project: {
                    reason: '$_id',
                    count: 1,
                    uniqueUsers: { $size: '$uniqueUsers' },
                    _id: 0
                }
            }
        ]);

        return {
            period: {
                from: lastMonth.toISOString(),
                to: now.toISOString()
            },
            trends: {
                tokenCreation: tokenTrends,
                deviceDistribution: deviceStats,
                usagePatterns: usagePatterns[0] || {},
                securityIncidents
            },
            summary: await this.getTokenStatistics()
        };
    }

    /**
     * Check for suspicious token activity
     */
    static async checkSuspiciousActivity() {
        const now = new Date();
        const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
        const suspiciousActivities = [];

        // Check for excessive token creation from same IP
        const excessiveCreation = await RefreshToken.aggregate([
            {
                $match: { createdAt: { $gte: lastHour } }
            },
            {
                $group: {
                    _id: '$deviceInfo.ip',
                    count: { $sum: 1 },
                    users: { $addToSet: '$userId' }
                }
            },
            {
                $match: { count: { $gte: 20 } } // More than 20 tokens in an hour
            }
        ]);

        if (excessiveCreation.length > 0) {
            suspiciousActivities.push({
                type: 'excessive_token_creation',
                description: 'Multiple token creation from same IP',
                data: excessiveCreation
            });
        }

        // Check for rapid token revocations
        const rapidRevocations = await RefreshToken.aggregate([
            {
                $match: { 
                    revokedAt: { $gte: lastHour },
                    revokedReason: 'security'
                }
            },
            {
                $group: {
                    _id: '$userId',
                    count: { $sum: 1 }
                }
            },
            {
                $match: { count: { $gte: 5 } } // More than 5 security revocations in an hour
            }
        ]);

        if (rapidRevocations.length > 0) {
            suspiciousActivities.push({
                type: 'rapid_security_revocations',
                description: 'Multiple security-related token revocations',
                data: rapidRevocations
            });
        }

        // Check for tokens with unusual usage patterns
        const unusualUsage = await RefreshToken.aggregate([
            {
                $match: { 
                    lastUsed: { $gte: lastHour },
                    usageCount: { $gte: 100 } // Very high usage count
                }
            }
        ]);

        if (unusualUsage.length > 0) {
            suspiciousActivities.push({
                type: 'unusual_token_usage',
                description: 'Tokens with unusually high usage count',
                data: unusualUsage
            });
        }

        // Log suspicious activities
        if (suspiciousActivities.length > 0) {
            console.warn('Suspicious token activities detected:', suspiciousActivities);
            
            // In a production environment, you might want to:
            // 1. Send alerts to security team
            // 2. Automatically revoke suspicious tokens
            // 3. Temporarily block suspicious IPs
            // 4. Log to security monitoring system
        }

        return suspiciousActivities;
    }

    /**
     * Revoke all tokens for a user (security action)
     */
    static async revokeAllUserTokens(userId, reason = 'security_action', revokedBy = null) {
        const results = {
            refreshTokens: 0,
            blacklistedTokens: 0
        };

        // Revoke all refresh tokens
        const refreshResult = await RefreshToken.revokeAllForUser(userId, 'staff', reason);
        results.refreshTokens = refreshResult.modifiedCount || 0;

        // Add to blacklist (for access tokens)
        try {
            await TokenBlacklist.blacklistAllForUser(userId, 'staff', reason, revokedBy);
            results.blacklistedTokens = 1;
        } catch (error) {
            console.error('Error blacklisting user tokens:', error);
        }

        console.log(`Revoked all tokens for user ${userId}: ${results.refreshTokens} refresh tokens, ${results.blacklistedTokens} blacklist entries`);
        
        return results;
    }

    /**
     * Get active sessions for all users (admin view)
     */
    static async getAllActiveSessions(options = {}) {
        const {
            page = 1,
            limit = 50,
            sortBy = 'lastUsed',
            sortOrder = 'desc'
        } = options;

        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const sessions = await RefreshToken.find({
            isRevoked: false,
            expiresAt: { $gt: new Date() }
        })
        .populate('userId', 'firstName lastName email')
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('-token -hashedToken');

        const total = await RefreshToken.countDocuments({
            isRevoked: false,
            expiresAt: { $gt: new Date() }
        });

        return {
            sessions,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Force expire tokens older than specified days
     */
    static async forceExpireOldTokens(daysOld = 30) {
        const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
        
        const result = await RefreshToken.updateMany(
            {
                createdAt: { $lt: cutoffDate },
                isRevoked: false
            },
            {
                $set: {
                    isRevoked: true,
                    revokedAt: new Date(),
                    revokedReason: 'forced_expiry'
                }
            }
        );

        console.log(`Force expired ${result.modifiedCount} tokens older than ${daysOld} days`);
        return result.modifiedCount;
    }

    /**
     * Optimize token storage (remove unnecessary data)
     */
    static async optimizeTokenStorage() {
        // Remove device info from very old revoked tokens to save space
        const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
        
        const result = await RefreshToken.updateMany(
            {
                revokedAt: { $lt: sixMonthsAgo },
                isRevoked: true
            },
            {
                $unset: { deviceInfo: 1 }
            }
        );

        console.log(`Optimized storage for ${result.modifiedCount} old revoked tokens`);
        return result.modifiedCount;
    }

    /**
     * Get token health report
     */
    static async getTokenHealthReport() {
        const stats = await this.getTokenStatistics();
        const now = new Date();
        
        // Calculate health metrics
        const activePercentage = stats.refreshTokens.total > 0 
            ? (stats.refreshTokens.active / stats.refreshTokens.total) * 100 
            : 0;

        const revokedPercentage = stats.refreshTokens.total > 0 
            ? (stats.refreshTokens.revoked / stats.refreshTokens.total) * 100 
            : 0;

        // Determine health status
        let healthStatus = 'healthy';
        const issues = [];

        if (activePercentage < 10) {
            healthStatus = 'warning';
            issues.push('Very low active token percentage');
        }

        if (revokedPercentage > 50) {
            healthStatus = 'warning';
            issues.push('High token revocation rate');
        }

        if (stats.blacklistedTokens.total > stats.refreshTokens.total) {
            healthStatus = 'critical';
            issues.push('Blacklisted tokens exceed refresh tokens');
        }

        return {
            healthStatus,
            issues,
            metrics: {
                activeTokenPercentage: Math.round(activePercentage * 100) / 100,
                revokedTokenPercentage: Math.round(revokedPercentage * 100) / 100,
                totalTokens: stats.refreshTokens.total,
                blacklistedTokens: stats.blacklistedTokens.total
            },
            statistics: stats,
            timestamp: now.toISOString()
        };
    }
}

module.exports = TokenManagementService;