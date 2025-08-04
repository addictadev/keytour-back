/**
 * Authentication Service - Core authentication logic
 * 
 * Implements SOLID principles:
 * - S: Single Responsibility - Handles only authentication logic
 * - O: Open/Closed - Extensible for new auth methods
 * - L: Liskov Substitution - Consistent interface
 * - I: Interface Segregation - Focused methods
 * - D: Dependency Inversion - Depends on abstractions
 * 
 * @author Expert Backend Developer
 * @version 2.0.0
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Staff = require('../models/StaffModel');
const RefreshToken = require('../models/RefreshTokenModel');
const TokenBlacklist = require('../models/TokenBlacklistModel');
const Role = require('../../src/model/RoleModel');
const CustomError = require('../../src/utils/customError');

class AuthService {
    /**
     * Generate JWT token with enhanced security
     * @param {Object} user - User object
     * @param {Object} options - Token options
     * @returns {Object} - Token data
     */
    static generateAccessToken(user, options = {}) {
        const payload = {
            id: user._id,
            email: user.email,
            role: user.role?.name || user.defaultrole,
            userType: options.userType || 'staff',
            jti: crypto.randomUUID(), // JWT ID for tracking
            iat: Math.floor(Date.now() / 1000)
        };

        const tokenOptions = {
            expiresIn: options.expiresIn || process.env.JWT_ACCESS_EXPIRES_IN || '100d',
            algorithm: 'HS256',
            issuer: process.env.JWT_ISSUER || 'keytour-api',
            audience: process.env.JWT_AUDIENCE || 'keytour-app'
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, tokenOptions);
        
        return {
            token,
            payload,
            expiresIn: tokenOptions.expiresIn,
            expiresAt: new Date(Date.now() + this.parseExpiresIn(tokenOptions.expiresIn))
        };
    }

    /**
     * Parse expires in string to milliseconds
     * @param {String} expiresIn - Expires in string (e.g., '15m', '1h', '7d')
     * @returns {Number} - Milliseconds
     */
    static parseExpiresIn(expiresIn) {
        const units = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000
        };

        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match) return 15 * 60 * 1000; // Default 15 minutes

        const [, value, unit] = match;
        return parseInt(value) * units[unit];
    }

    /**
     * Verify JWT token
     * @param {String} token - JWT token
     * @returns {Object} - Decoded payload
     */
    static async verifyAccessToken(token) {
        try {
            // Check if token is blacklisted
            const isBlacklisted = await TokenBlacklist.isTokenBlacklisted(token);
            if (isBlacklisted) {
                throw new CustomError('Token has been invalidated', 401);
            }

            const options = {
                algorithms: ['HS256'],
                issuer: process.env.JWT_ISSUER || 'keytour-api',
                audience: process.env.JWT_AUDIENCE || 'keytour-app'
            };

            const decoded = jwt.verify(token, process.env.JWT_SECRET, options);
            return decoded;
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new CustomError('Token has expired', 401);
            } else if (error.name === 'JsonWebTokenError') {
                throw new CustomError('Invalid token', 401);
            } else if (error instanceof CustomError) {
                throw error;
            } else {
                throw new CustomError('Token verification failed', 401);
            }
        }
    }

    /**
     * Staff login with enhanced security
     * @param {Object} loginData - Login credentials
     * @param {Object} deviceInfo - Device information
     * @returns {Object} - Authentication result
     */
    static async loginStaff(loginData, deviceInfo = {}) {
        const { email, password, rememberMe = false } = loginData;

        // Input validation
        if (!email || !password) {
            throw new CustomError('Email and password are required', 400);
        }

        // Find staff member
        const staff = await Staff.findByEmail(email).select('+password');
        
        if (!staff) {
            throw new CustomError('Invalid email or password', 401);
        }

        // Check account status
        if (!staff.isActive) {
            throw new CustomError('Account is inactive. Please contact administrator', 403);
        }

        if (staff.isBlocked) {
            throw new CustomError('Account is blocked. Please contact administrator', 403);
        }

        if (staff.isLocked) {
            throw new CustomError(`Account is locked until ${staff.lockUntil}. Please try again later`, 423);
        }

        // Verify password
        const isPasswordValid = await staff.checkPassword(password);
        
        if (!isPasswordValid) {
            await staff.incLoginAttempts();
            throw new CustomError('Invalid email or password', 401);
        }

        // Reset failed login attempts on successful login
        await staff.resetLoginAttempts();

        // Populate role with permissions
        await staff.populate({
            path: 'role',
            populate: {
                path: 'permissions',
                model: 'Permission'
            }
        });

        // Generate tokens
        const accessTokenData = this.generateAccessToken(staff, { userType: 'staff' });
        const { token: refreshToken } = await RefreshToken.createRefreshToken(
            staff._id, 
            'staff', 
            deviceInfo
        );

        // Update last login
        staff.lastLogin = new Date();
        await staff.save({ validateBeforeSave: false });

        return {
            staff: this.sanitizeUser(staff),
            accessToken: accessTokenData.token,
            refreshToken: rememberMe ? refreshToken : null,
            permissions: staff.role?.permissions?.map(p => p.name) || [],
            expiresAt: accessTokenData.expiresAt
        };
    }

    /**
     * Refresh access token
     * @param {String} refreshToken - Refresh token
     * @param {Object} deviceInfo - Device information
     * @returns {Object} - New tokens
     */
    static async refreshAccessToken(refreshToken, deviceInfo = {}) {
        if (!refreshToken) {
            throw new CustomError('Refresh token is required', 400);
        }

        // Find and validate refresh token
        const tokenDoc = await RefreshToken.findValidToken(refreshToken);
        
        if (!tokenDoc) {
            throw new CustomError('Invalid or expired refresh token', 401);
        }

        // Update token usage
        await tokenDoc.updateUsage();

        // Find user
        const staff = await Staff.findById(tokenDoc.userId).populate({
            path: 'role',
            populate: {
                path: 'permissions',
                model: 'Permission'
            }
        });

        if (!staff || !staff.isActive || staff.isBlocked) {
            await tokenDoc.revoke('account_inactive');
            throw new CustomError('Account is not active', 403);
        }

        // Generate new access token
        const accessTokenData = this.generateAccessToken(staff, { userType: tokenDoc.userType });

        // Optional: Rotate refresh token for enhanced security
        const shouldRotate = process.env.REFRESH_TOKEN_ROTATION === 'true';
        let newRefreshToken = refreshToken;

        if (shouldRotate) {
            await tokenDoc.revoke('rotation');
            const { token } = await RefreshToken.createRefreshToken(
                staff._id,
                tokenDoc.userType,
                deviceInfo
            );
            newRefreshToken = token;
        }

        return {
            staff: this.sanitizeUser(staff),
            accessToken: accessTokenData.token,
            refreshToken: newRefreshToken,
            permissions: staff.role?.permissions?.map(p => p.name) || [],
            expiresAt: accessTokenData.expiresAt
        };
    }

    /**
     * Logout user and invalidate tokens
     * @param {String} accessToken - Access token to blacklist
     * @param {String} refreshToken - Refresh token to revoke
     * @param {Object} deviceInfo - Device information
     * @returns {Boolean} - Success status
     */
    static async logout(accessToken, refreshToken, deviceInfo = {}) {
        const results = [];

        // Blacklist access token if provided
        if (accessToken) {
            try {
                const decoded = jwt.decode(accessToken);
                if (decoded) {
                    await TokenBlacklist.blacklistToken({
                        token: accessToken,
                        jti: decoded.jti,
                        userId: decoded.id,
                        userType: decoded.userType || 'staff',
                        expiresAt: new Date(decoded.exp * 1000),
                        reason: 'logout',
                        deviceInfo
                    });
                    results.push('Access token blacklisted');
                }
            } catch (error) {
                console.error('Error blacklisting access token:', error);
            }
        }

        // Revoke refresh token if provided
        if (refreshToken) {
            try {
                const tokenDoc = await RefreshToken.findValidToken(refreshToken);
                if (tokenDoc) {
                    await tokenDoc.revoke('logout');
                    results.push('Refresh token revoked');
                }
            } catch (error) {
                console.error('Error revoking refresh token:', error);
            }
        }

        return results.length > 0;
    }

    /**
     * Logout from all devices
     * @param {String} userId - User ID
     * @param {String} userType - User type
     * @param {String} reason - Logout reason
     * @returns {Boolean} - Success status
     */
    static async logoutAllDevices(userId, userType = 'staff', reason = 'logout_all') {
        try {
            // Revoke all refresh tokens
            await RefreshToken.revokeAllForUser(userId, userType, reason);
            
            // Note: For blacklisting all access tokens, you'd need to track them
            // For now, we'll create a marker entry
            await TokenBlacklist.blacklistAllForUser(userId, userType, reason);
            
            return true;
        } catch (error) {
            console.error('Error during logout all devices:', error);
            return false;
        }
    }

    /**
     * Change password with token invalidation
     * @param {String} userId - User ID
     * @param {String} currentPassword - Current password
     * @param {String} newPassword - New password
     * @returns {Boolean} - Success status
     */
    static async changePassword(userId, currentPassword, newPassword) {
        const staff = await Staff.findById(userId).select('+password');
        
        if (!staff) {
            throw new CustomError('User not found', 404);
        }

        // Verify current password
        const isCurrentPasswordValid = await staff.checkPassword(currentPassword);
        if (!isCurrentPasswordValid) {
            throw new CustomError('Current password is incorrect', 400);
        }

        // Validate new password
        if (newPassword.length < 8) {
            throw new CustomError('New password must be at least 8 characters long', 400);
        }

        // Update password
        staff.password = newPassword;
        staff.lastPasswordChange = new Date();
        await staff.save();

        // Invalidate all tokens for security
        await this.logoutAllDevices(userId, 'staff', 'password_change');

        return true;
    }

    /**
     * Sanitize user data for response
     * @param {Object} user - User object
     * @returns {Object} - Sanitized user data
     */
    static sanitizeUser(user) {
        const userObj = user.toObject ? user.toObject() : user;
        
        // Remove sensitive fields
        delete userObj.password;
        delete userObj.twoFactorSecret;
        delete userObj.failedLoginAttempts;
        delete userObj.lockUntil;
        delete userObj.__v;
        
        return userObj;
    }

    /**
     * Validate token structure and claims
     * @param {Object} decoded - Decoded token payload
     * @returns {Boolean} - Validation result
     */
    static validateTokenClaims(decoded) {
        const requiredClaims = ['id', 'email', 'role', 'userType', 'jti', 'iat'];
        
        for (const claim of requiredClaims) {
            if (!decoded[claim]) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Get user by token
     * @param {String} token - Access token
     * @returns {Object} - User data with permissions
     */
    static async getUserByToken(token) {
        const decoded = await this.verifyAccessToken(token);
        
        if (!this.validateTokenClaims(decoded)) {
            throw new CustomError('Invalid token claims', 401);
        }

        const staff = await Staff.findById(decoded.id).populate({
            path: 'role',
            populate: {
                path: 'permissions',
                model: 'Permission'
            }
        });

        if (!staff || !staff.isActive || staff.isBlocked) {
            throw new CustomError('User not found or inactive', 404);
        }

        return {
            user: this.sanitizeUser(staff),
            permissions: staff.role?.permissions?.map(p => p.name) || [],
            tokenClaims: decoded
        };
    }
}

module.exports = AuthService;