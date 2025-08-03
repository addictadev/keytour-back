/**
 * Authentication Routes V2 - Enhanced authentication endpoints
 * 
 * Features:
 * - Staff authentication
 * - Token management
 * - Session management
 * - Profile management
 * - Security endpoints
 * 
 * @author Expert Backend Developer
 * @version 2.0.0
 */

const express = require('express');
const AuthController = require('../controllers/AuthController');
const AuthMiddleware = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for authentication endpoints
const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const strictAuthRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Stricter limit for sensitive operations
    message: {
        error: 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// ========================================
// PUBLIC ROUTES (No Authentication Required)
// ========================================

/**
 * @swagger
 * /api/v2/auth/health:
 *   get:
 *     summary: Health check for authentication service
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get('/health', AuthController.healthCheck);

/**
 * @swagger
 * /api/v2/auth/login:
 *   post:
 *     summary: Staff login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               rememberMe:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       423:
 *         description: Account locked
 */
router.post('/login', authRateLimit, AuthController.login);

/**
 * @swagger
 * /api/v2/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token (can also be sent as cookie)
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', authRateLimit, AuthController.refreshToken);

/**
 * @swagger
 * /api/v2/auth/verify:
 *   post:
 *     summary: Verify token validity
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token verification result
 */
router.post('/verify', authRateLimit, AuthController.verifyToken);

/**
 * @swagger
 * /api/v2/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset link sent (if email exists)
 */
router.post('/forgot-password', strictAuthRateLimit, AuthController.forgotPassword);

/**
 * @swagger
 * /api/v2/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid token or password mismatch
 */
router.post('/reset-password', strictAuthRateLimit, AuthController.resetPassword);

// ========================================
// PROTECTED ROUTES (Authentication Required)
// ========================================

/**
 * @swagger
 * /api/v2/auth/logout:
 *   post:
 *     summary: Logout current session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token (can also be sent as cookie)
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', AuthMiddleware.optionalAuth, AuthController.logout);

/**
 * @swagger
 * /api/v2/auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices
 *       401:
 *         description: Authentication required
 */
router.post('/logout-all', 
    AuthMiddleware.requireAuth({
        requireEmailVerification: false,
        validateSession: true
    }), 
    AuthController.logoutAll
);

/**
 * @swagger
 * /api/v2/auth/change-password:
 *   put:
 *     summary: Change current password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid current password or password mismatch
 */
router.put('/change-password', 
    AuthMiddleware.requireAuth({
        requireEmailVerification: false,
        validateSession: true
    }),
    strictAuthRateLimit,
    AuthController.changePassword
);

/**
 * @swagger
 * /api/v2/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/profile', 
    AuthMiddleware.requireAuth({
        requireEmailVerification: false,
        validateSession: true
    }), 
    AuthController.getProfile
);

/**
 * @swagger
 * /api/v2/auth/profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               timezone:
 *                 type: string
 *               language:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input data
 */
router.put('/profile', 
    AuthMiddleware.requireAuth({
        requireEmailVerification: false,
        validateSession: true
    }), 
    AuthController.updateProfile
);

/**
 * @swagger
 * /api/v2/auth/sessions:
 *   get:
 *     summary: Get active sessions for current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active sessions retrieved successfully
 */
router.get('/sessions', 
    AuthMiddleware.requireAuth({
        requireEmailVerification: false,
        validateSession: true
    }), 
    AuthController.getSessions
);

/**
 * @swagger
 * /api/v2/auth/sessions/{sessionId}:
 *   delete:
 *     summary: Revoke specific session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID to revoke
 *     responses:
 *       200:
 *         description: Session revoked successfully
 *       404:
 *         description: Session not found
 */
router.delete('/sessions/:sessionId', 
    AuthMiddleware.requireAuth({
        requireEmailVerification: false,
        validateSession: true
    }), 
    AuthController.revokeSession
);

module.exports = router;