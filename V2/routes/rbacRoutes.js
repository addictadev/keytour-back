/**
 * RBAC Routes V2 - Role and Permission management endpoints
 * 
 * Features:
 * - Complete role CRUD operations
 * - Permission management
 * - Permission checking
 * - Bulk operations
 * - System initialization
 * 
 * @author Expert Backend Developer
 * @version 2.0.0
 */

const express = require('express');
const RBACController = require('../controllers/RBACController');
const AuthMiddleware = require('../middleware/authMiddleware');
const PermissionMiddleware = require('../middleware/permissionMiddleware');

const router = express.Router();

// Apply authentication to all routes
router.use(AuthMiddleware.requireAuth({
    requireEmailVerification: false,
    validateSession: true,
    allowedUserTypes: ['staff']
}));

// Apply permission information middleware
router.use(PermissionMiddleware.attachPermissionInfo);

// ========================================
// SYSTEM OVERVIEW AND INITIALIZATION
// ========================================

/**
 * @swagger
 * /api/v2/rbac/overview:
 *   get:
 *     summary: Get RBAC system overview
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System overview retrieved successfully
 */
router.get('/overview', 
    PermissionMiddleware.requirePermissions('read:permissions', 'read:roles'),
    RBACController.getSystemOverview
);

/**
 * @swagger
 * /api/v2/rbac/initialize:
 *   post:
 *     summary: Initialize RBAC system with default permissions and roles
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: RBAC system initialized successfully
 *       403:
 *         description: Insufficient permissions
 */
router.post('/initialize', 
    PermissionMiddleware.requirePermissionsWithSuperAdminBypass('create:permissions', 'create:roles'),
    RBACController.initializeRBAC
);

// ========================================
// PERMISSION MANAGEMENT
// ========================================

/**
 * @swagger
 * /api/v2/rbac/permissions:
 *   get:
 *     summary: Get all permissions with pagination
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: name
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 */
router.get('/permissions', 
    PermissionMiddleware.requirePermissions('read:permissions'),
    RBACController.getAllPermissions
);

/**
 * @swagger
 * /api/v2/rbac/permissions:
 *   post:
 *     summary: Create new permission
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 pattern: '^[a-z_]+:[a-z_]+$'
 *                 example: 'create:tours'
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Permission created successfully
 *       400:
 *         description: Invalid permission format
 *       409:
 *         description: Permission already exists
 */
router.post('/permissions', 
    PermissionMiddleware.requirePermissions('create:permissions'),
    RBACController.createPermission
);

/**
 * @swagger
 * /api/v2/rbac/permissions/{id}:
 *   put:
 *     summary: Update permission
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 pattern: '^[a-z_]+:[a-z_]+$'
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permission updated successfully
 *       404:
 *         description: Permission not found
 */
router.put('/permissions/:id', 
    PermissionMiddleware.requirePermissions('update:permissions'),
    RBACController.updatePermission
);

/**
 * @swagger
 * /api/v2/rbac/permissions/{id}:
 *   delete:
 *     summary: Delete permission
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission deleted successfully
 *       404:
 *         description: Permission not found
 *       409:
 *         description: Permission is being used by roles
 */
router.delete('/permissions/:id', 
    PermissionMiddleware.requirePermissions('delete:permissions'),
    RBACController.deletePermission
);

/**
 * @swagger
 * /api/v2/rbac/permissions/bulk:
 *   post:
 *     summary: Bulk create permissions
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *     responses:
 *       200:
 *         description: Bulk operation completed
 */
router.post('/permissions/bulk', 
    PermissionMiddleware.requirePermissions('create:permissions'),
    RBACController.bulkCreatePermissions
);

/**
 * @swagger
 * /api/v2/rbac/permissions/statistics:
 *   get:
 *     summary: Get permission usage statistics
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/permissions/statistics', 
    PermissionMiddleware.requirePermissions('read:reports'),
    RBACController.getPermissionStatistics
);

// ========================================
// ROLE MANAGEMENT
// ========================================

/**
 * @swagger
 * /api/v2/rbac/roles:
 *   get:
 *     summary: Get all roles with pagination
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: includePermissions
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 */
router.get('/roles', 
    PermissionMiddleware.requirePermissions('read:roles'),
    RBACController.getAllRoles
);

/**
 * @swagger
 * /api/v2/rbac/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role retrieved successfully
 *       404:
 *         description: Role not found
 */
router.get('/roles/:id', 
    PermissionMiddleware.requirePermissions('read:roles'),
    RBACController.getRoleById
);

/**
 * @swagger
 * /api/v2/rbac/roles:
 *   post:
 *     summary: Create new role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Role already exists
 */
router.post('/roles', 
    PermissionMiddleware.requirePermissions('create:roles'),
    RBACController.createRole
);

/**
 * @swagger
 * /api/v2/rbac/roles/{id}:
 *   put:
 *     summary: Update role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       404:
 *         description: Role not found
 */
router.put('/roles/:id', 
    PermissionMiddleware.requirePermissions('update:roles'),
    RBACController.updateRole
);

/**
 * @swagger
 * /api/v2/rbac/roles/{id}:
 *   delete:
 *     summary: Delete role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       404:
 *         description: Role not found
 *       409:
 *         description: Role is assigned to staff members
 */
router.delete('/roles/:id', 
    PermissionMiddleware.requirePermissions('delete:roles'),
    RBACController.deleteRole
);

/**
 * @swagger
 * /api/v2/rbac/roles/{id}/permissions:
 *   post:
 *     summary: Add permissions to role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Permissions added successfully
 */
router.post('/roles/:id/permissions', 
    PermissionMiddleware.requirePermissions('update:roles'),
    RBACController.addPermissionsToRole
);

/**
 * @swagger
 * /api/v2/rbac/roles/{id}/permissions:
 *   delete:
 *     summary: Remove permissions from role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Permissions removed successfully
 */
router.delete('/roles/:id/permissions', 
    PermissionMiddleware.requirePermissions('update:roles'),
    RBACController.removePermissionsFromRole
);

/**
 * @swagger
 * /api/v2/rbac/roles/bulk:
 *   post:
 *     summary: Bulk create roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roles
 *             properties:
 *               roles:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       200:
 *         description: Bulk operation completed
 */
router.post('/roles/bulk', 
    PermissionMiddleware.requirePermissions('create:roles'),
    RBACController.bulkCreateRoles
);

/**
 * @swagger
 * /api/v2/rbac/roles/statistics:
 *   get:
 *     summary: Get role usage statistics
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/roles/statistics', 
    PermissionMiddleware.requirePermissions('read:reports'),
    RBACController.getRoleStatistics
);

// ========================================
// PERMISSION CHECKING
// ========================================

/**
 * @swagger
 * /api/v2/rbac/check-permission:
 *   post:
 *     summary: Check if user has specific permission
 *     tags: [Permission Checking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - permission
 *             properties:
 *               userId:
 *                 type: string
 *               permission:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permission check completed
 */
router.post('/check-permission', 
    PermissionMiddleware.requirePermissions('read:permissions'),
    RBACController.checkPermission
);

/**
 * @swagger
 * /api/v2/rbac/check-any-permission:
 *   post:
 *     summary: Check if user has any of the specified permissions
 *     tags: [Permission Checking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - permissions
 *             properties:
 *               userId:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Permission check completed
 */
router.post('/check-any-permission', 
    PermissionMiddleware.requirePermissions('read:permissions'),
    RBACController.checkAnyPermission
);

/**
 * @swagger
 * /api/v2/rbac/check-all-permissions:
 *   post:
 *     summary: Check if user has all of the specified permissions
 *     tags: [Permission Checking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - permissions
 *             properties:
 *               userId:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Permission check completed
 */
router.post('/check-all-permissions', 
    PermissionMiddleware.requirePermissions('read:permissions'),
    RBACController.checkAllPermissions
);

/**
 * @swagger
 * /api/v2/rbac/user/{userId}/permissions:
 *   get:
 *     summary: Get user permissions
 *     tags: [Permission Checking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User permissions retrieved successfully
 */
router.get('/user/:userId/permissions', 
    PermissionMiddleware.requireOwnershipOrPermission('userId', 'read:permissions'),
    RBACController.getUserPermissions
);

// ========================================
// ROLE ASSIGNMENT
// ========================================

/**
 * @swagger
 * /api/v2/rbac/assign-role:
 *   post:
 *     summary: Assign role to staff member
 *     tags: [Role Assignment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - staffId
 *               - roleId
 *             properties:
 *               staffId:
 *                 type: string
 *               roleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role assigned successfully
 *       404:
 *         description: Staff member or role not found
 */
router.post('/assign-role', 
    PermissionMiddleware.requirePermissions('update:staff', 'update:roles'),
    RBACController.assignRole
);

/**
 * @swagger
 * /api/v2/rbac/remove-role:
 *   post:
 *     summary: Remove role from staff member
 *     tags: [Role Assignment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - staffId
 *               - roleId
 *             properties:
 *               staffId:
 *                 type: string
 *               roleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role removed successfully
 *       404:
 *         description: Staff member or role not found
 *       400:
 *         description: Cannot remove primary role or role not assigned
 */
router.post('/remove-role', 
    PermissionMiddleware.requirePermissions('update:staff', 'update:roles'),
    RBACController.removeRole
);

/**
 * @swagger
 * /api/v2/rbac/add-additional-role:
 *   post:
 *     summary: Add additional role to staff member (multi-role support)
 *     tags: [Role Assignment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - staffId
 *               - roleId
 *             properties:
 *               staffId:
 *                 type: string
 *               roleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Additional role added successfully
 *       404:
 *         description: Staff member or role not found
 *       409:
 *         description: Role already assigned to staff member
 */
router.post('/add-additional-role', 
    PermissionMiddleware.requirePermissions('update:staff', 'update:roles'),
    RBACController.addAdditionalRole
);

/**
 * @swagger
 * /api/v2/rbac/set-primary-role:
 *   post:
 *     summary: Set primary role for staff member
 *     tags: [Role Assignment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - staffId
 *               - roleId
 *             properties:
 *               staffId:
 *                 type: string
 *               roleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Primary role set successfully
 *       404:
 *         description: Staff member or role not found
 *       400:
 *         description: Role must be assigned to staff before setting as primary
 */
router.post('/set-primary-role', 
    PermissionMiddleware.requirePermissions('update:staff', 'update:roles'),
    RBACController.setPrimaryRole
);

/**
 * @swagger
 * /api/v2/rbac/staff/{staffId}/roles:
 *   get:
 *     summary: Get all roles for a staff member
 *     tags: [Role Assignment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff roles retrieved successfully
 *       404:
 *         description: Staff member not found
 */
router.get('/staff/:staffId/roles', 
    PermissionMiddleware.requireOwnershipOrPermission('staffId', 'read:staff'),
    RBACController.getStaffRoles
);

/**
 * @swagger
 * /api/v2/rbac/bulk-assign-roles:
 *   post:
 *     summary: Bulk assign roles to multiple staff members
 *     tags: [Role Assignment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assignments
 *             properties:
 *               assignments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - staffId
 *                     - roleId
 *                   properties:
 *                     staffId:
 *                       type: string
 *                     roleId:
 *                       type: string
 *                     setPrimary:
 *                       type: boolean
 *                       default: false
 *     responses:
 *       200:
 *         description: Bulk role assignment completed
 */
router.post('/bulk-assign-roles', 
    PermissionMiddleware.requirePermissions('update:staff', 'update:roles'),
    RBACController.bulkAssignRoles
);

module.exports = router;