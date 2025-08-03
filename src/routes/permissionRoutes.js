const express = require('express');
const PermissionController = require('../controllers/permissionController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

// Only admin can access these routes
// router.use(authMiddleware('admin'));

// Get all permissions
router.get('/permissions', PermissionController.getAllPermissions);

// Get all roles with their permissions
router.get('/roles', PermissionController.getAllRoles);

// Get specific role with its permissions
router.get('/roles/:id', PermissionController.getRoleById);

// Update role permissions
router.patch('/roles/:id/permissions', PermissionController.updateRolePermissions);

module.exports = router;