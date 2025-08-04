const express = require('express');
const DestinationController = require('../controllers/destinationController');
const uploadFiles = require('../middlewares/upload');
const authMiddleware = require('../middlewares/authMiddleware');
const rbacWrapper = require('../middlewares/rbacWrapper');
const router = express.Router();
const AuthMiddleware = require('../../V2/middleware/authMiddleware');
const PermissionMiddleware = require('../../V2/middleware/permissionMiddleware');
// Public route - everyone can view destinations
router
    .route('/')
    .get(DestinationController.getAllDestinations);

// Public route - everyone can view specific destination
router
    .route('/:id')
    .get(DestinationController.getDestinationById);

    router.use(AuthMiddleware.requireAuth({
        requireEmailVerification: false,
        validateSession: true,
        allowedUserTypes: ['staff']
    }));
    router.use(PermissionMiddleware.attachPermissionInfo);
// Protected routes - require authentication and permissions (ADMIN ONLY)
router.post(
    '/',
    PermissionMiddleware.requirePermissions('read:permissions', 'read:roles'),// New RBAC permission check
    uploadFiles,  // Middleware to handle image uploads
    DestinationController.createDestination
);

router
    .route('/:id')
    .put(
        PermissionMiddleware.requirePermissions('read:permissions', 'read:roles'),// New RBAC permission check
        // New RBAC permission check
        uploadFiles,
        DestinationController.updateDestination
    )
    .delete(
        PermissionMiddleware.requirePermissions('read:permissions', 'read:roles'),// New RBAC permission check
        // New RBAC permission check
        DestinationController.deleteDestination
    );

module.exports = router;
