/**
 * V2 Routes Index - Main routing configuration for RBAC system
 * 
 * Features:
 * - Centralized route management
 * - API versioning
 * - Comprehensive error handling
 * - Security middleware
 * - Rate limiting
 * - Documentation endpoints
 * 
 * @author Expert Backend Developer
 * @version 2.0.0
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Import route modules
const authRoutes = require('./authRoutes');
const staffRoutes = require('./staffRoutes');
const rbacRoutes = require('./rbacRoutes');

// Import existing V2 routes
const destinationRoutes = require('./destinationRoutes');
const paymentRoutes = require('./paymentRoutes');

// Import middleware
const errorHandler = require('../../src/middlewares/errorHandler');
const response = require('../../src/utils/response');

const router = express.Router();

// ========================================
// SECURITY MIDDLEWARE
// ========================================

// Security headers
router.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://keytour-admin.vercel.app',
            // Add your production domains here
        ];
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Device-ID',
        'X-Platform',
        'X-Browser'
    ]
};

router.use(cors(corsOptions));

// General rate limiting
const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req, res) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/api/v2/health';
    }
});

router.use(generalRateLimit);

// ========================================
// API DOCUMENTATION AND HEALTH
// ========================================

/**
 * @swagger
 * /api/v2/health:
 *   get:
 *     summary: Health check for V2 API
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is healthy
 */
router.get('/health', (req, res) => {
    response(res, 200, {
        service: 'KeyTour API V2',
        version: '2.0.0',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        features: [
            'Enhanced RBAC System',
            'Staff Management',
            'Token Management',
            'Session Management',
            'Permission System',
            'Audit Trail',
            'Security Features'
        ],
        endpoints: {
            auth: '/api/v2/auth',
            staff: '/api/v2/staff',
            rbac: '/api/v2/rbac',
            destinations: '/api/v2/destinations',
            payments: '/api/v2/payments'
        }
    }, 'KeyTour API V2 is running successfully');
});

/**
 * @swagger
 * /api/v2/info:
 *   get:
 *     summary: Get API information and capabilities
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API information retrieved successfully
 */
router.get('/info', (req, res) => {
    response(res, 200, {
        api: {
            name: 'KeyTour RBAC API',
            version: '2.0.0',
            description: 'Enhanced Role-Based Access Control API for KeyTour platform',
            documentation: '/api/v2/docs',
            contact: {
                email: 'api@keytour.com',
                support: 'support@keytour.com'
            }
        },
        features: {
            authentication: {
                methods: ['JWT', 'Refresh Tokens'],
                security: ['Token Blacklisting', 'Session Management', 'Rate Limiting'],
                endpoints: '/api/v2/auth'
            },
            rbac: {
                features: ['Roles', 'Permissions', 'Dynamic Authorization'],
                granularity: 'Resource-based permissions',
                endpoints: '/api/v2/rbac'
            },
            staff: {
                features: ['CRUD Operations', 'Role Assignment', 'Session Management'],
                bulkOperations: true,
                endpoints: '/api/v2/staff'
            }
        },
        security: {
            authentication: 'Bearer Token (JWT)',
            authorization: 'Role-Based Access Control (RBAC)',
            rateLimiting: 'IP-based rate limiting',
            cors: 'Configurable CORS policy',
            headers: 'Security headers with Helmet.js'
        }
    }, 'API information retrieved successfully');
});

// ========================================
// ROUTE MOUNTING
// ========================================

// Authentication routes
router.use('/auth', authRoutes);

// Staff management routes
router.use('/staff', staffRoutes);

// RBAC (Roles and Permissions) routes
router.use('/rbac', rbacRoutes);

// Existing V2 routes
router.use('/destinations', destinationRoutes);
router.use('/payments', paymentRoutes);

// ========================================
// API DOCUMENTATION
// ========================================

/**
 * @swagger
 * /api/v2/docs:
 *   get:
 *     summary: API Documentation
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API documentation
 */
router.get('/docs', (req, res) => {
    res.json({
        message: 'API Documentation',
        swagger: '/api/v2/swagger.json',
        endpoints: {
            'Authentication': {
                'POST /auth/login': 'Staff login',
                'POST /auth/refresh': 'Refresh access token',
                'POST /auth/logout': 'Logout current session',
                'POST /auth/logout-all': 'Logout from all devices',
                'PUT /auth/change-password': 'Change password',
                'GET /auth/profile': 'Get current user profile',
                'PUT /auth/profile': 'Update current user profile',
                'GET /auth/sessions': 'Get active sessions'
            },
            'Staff Management': {
                'GET /staff': 'Get all staff members',
                'POST /staff': 'Create new staff member',
                'GET /staff/:id': 'Get staff member by ID',
                'PUT /staff/:id': 'Update staff member',
                'DELETE /staff/:id': 'Delete staff member',
                'PATCH /staff/:id/block': 'Block/unblock staff member',
                'POST /staff/:id/assign-role': 'Assign role to staff member'
            },
            'RBAC System': {
                'GET /rbac/permissions': 'Get all permissions',
                'POST /rbac/permissions': 'Create new permission',
                'GET /rbac/roles': 'Get all roles',
                'POST /rbac/roles': 'Create new role',
                'POST /rbac/check-permission': 'Check user permission',
                'POST /rbac/assign-role': 'Assign role to staff member',
                'POST /rbac/initialize': 'Initialize RBAC system'
            }
        }
    });
});

// ========================================
// ERROR HANDLING
// ========================================

// 404 handler for V2 routes
router.use('*', (req, res) => {
    response(res, 404, null, `Route ${req.method} ${req.originalUrl} not found in V2 API`);
});

// Error handling middleware
router.use(errorHandler);

module.exports = router;