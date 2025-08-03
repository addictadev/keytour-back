/**
 * Staff Routes V2 - Staff management endpoints
 * 
 * Features:
 * - Complete staff CRUD operations
 * - Advanced filtering and search
 * - Role assignment
 * - Account status management
 * - Bulk operations
 * - Export functionality
 * 
 * @author Expert Backend Developer
 * @version 2.0.0
 */

const express = require('express');
const StaffController = require('../controllers/StaffController');
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
// STAFF CRUD OPERATIONS
// ========================================

/**
 * @swagger
 * /api/v2/staff:
 *   get:
 *     summary: Get all staff members with filtering and pagination
 *     tags: [Staff]
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
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isBlocked
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Staff members retrieved successfully
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', 
    PermissionMiddleware.requirePermissions('read:staff'),
    StaffController.getAllStaff
);

/**
 * @swagger
 * /api/v2/staff/{id}:
 *   get:
 *     summary: Get staff member by ID
 *     tags: [Staff]
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
 *         description: Staff member retrieved successfully
 *       404:
 *         description: Staff member not found
 */
router.get('/:id', 
    PermissionMiddleware.requireOwnershipOrPermission('_id', 'read:staff'),
    StaffController.getStaffById
);

/**
 * @swagger
 * /api/v2/staff:
 *   post:
 *     summary: Create new staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - role
 *               - department
 *               - employeeId
 *               - position
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *               department:
 *                 type: string
 *                 enum: ['IT', 'Marketing', 'Sales', 'Customer Support', 'Content', 'Finance', 'HR', 'Operations']
 *               employeeId:
 *                 type: string
 *               position:
 *                 type: string
 *     responses:
 *       201:
 *         description: Staff member created successfully
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Email or employee ID already exists
 */
router.post('/', 
    PermissionMiddleware.requirePermissions('create:staff'),
    StaffController.createStaff
);

/**
 * @swagger
 * /api/v2/staff/{id}:
 *   put:
 *     summary: Update staff member
 *     tags: [Staff]
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               department:
 *                 type: string
 *               position:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               isBlocked:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Staff member updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Staff member not found
 */
router.put('/:id', 
    PermissionMiddleware.requireOwnershipOrPermission('_id', 'update:staff'),
    StaffController.updateStaff
);

/**
 * @swagger
 * /api/v2/staff/{id}:
 *   delete:
 *     summary: Delete staff member (soft delete)
 *     tags: [Staff]
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
 *         description: Staff member deleted successfully
 *       404:
 *         description: Staff member not found
 */
router.delete('/:id', 
    PermissionMiddleware.requirePermissions('delete:staff'),
    StaffController.deleteStaff
);

// ========================================
// STAFF MANAGEMENT OPERATIONS
// ========================================

/**
 * @swagger
 * /api/v2/staff/{id}/block:
 *   patch:
 *     summary: Block or unblock staff member
 *     tags: [Staff]
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
 *               - isBlocked
 *             properties:
 *               isBlocked:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Staff member status updated successfully
 */
router.patch('/:id/block', 
    PermissionMiddleware.requirePermissions('update:staff'),
    StaffController.toggleBlockStatus
);

/**
 * @swagger
 * /api/v2/staff/{id}/reset-password:
 *   post:
 *     summary: Reset staff member password
 *     tags: [Staff]
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
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.post('/:id/reset-password', 
    PermissionMiddleware.requirePermissions('update:staff'),
    StaffController.resetPassword
);

/**
 * @swagger
 * /api/v2/staff/{id}/assign-role:
 *   post:
 *     summary: Assign role to staff member
 *     tags: [Staff]
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
 *               - roleId
 *             properties:
 *               roleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role assigned successfully
 */
router.post('/:id/assign-role', 
    PermissionMiddleware.requirePermissions('update:staff', 'update:roles'),
    StaffController.assignRole
);

// ========================================
// SESSION MANAGEMENT
// ========================================

/**
 * @swagger
 * /api/v2/staff/{id}/sessions:
 *   get:
 *     summary: Get staff member's active sessions
 *     tags: [Staff]
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
 *         description: Sessions retrieved successfully
 */
router.get('/:id/sessions', 
    PermissionMiddleware.requireOwnershipOrPermission('_id', 'read:staff'),
    StaffController.getStaffSessions
);

/**
 * @swagger
 * /api/v2/staff/{id}/sessions/{sessionId}:
 *   delete:
 *     summary: Revoke staff member's session
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session revoked successfully
 */
router.delete('/:id/sessions/:sessionId', 
    PermissionMiddleware.requireOwnershipOrPermission('_id', 'update:staff'),
    StaffController.revokeStaffSession
);

// ========================================
// SEARCH AND FILTERING
// ========================================

/**
 * @swagger
 * /api/v2/staff/search:
 *   get:
 *     summary: Search staff members
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Search completed successfully
 */
router.get('/search', 
    PermissionMiddleware.requirePermissions('read:staff'),
    StaffController.searchStaff
);

// ========================================
// STATISTICS AND REPORTING
// ========================================

/**
 * @swagger
 * /api/v2/staff/statistics:
 *   get:
 *     summary: Get staff statistics
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/statistics', 
    PermissionMiddleware.requirePermissions('read:reports'),
    StaffController.getStatistics
);

/**
 * @swagger
 * /api/v2/staff/export:
 *   get:
 *     summary: Export staff data
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *     responses:
 *       200:
 *         description: Data exported successfully
 */
router.get('/export', 
    PermissionMiddleware.requirePermissions('export:reports'),
    StaffController.exportStaff
);

// ========================================
// BULK OPERATIONS
// ========================================

/**
 * @swagger
 * /api/v2/staff/bulk:
 *   post:
 *     summary: Perform bulk operations on staff members
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operation
 *               - staffIds
 *             properties:
 *               operation:
 *                 type: string
 *                 enum: [block, unblock, activate, deactivate, assign-role]
 *               staffIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               data:
 *                 type: object
 *                 properties:
 *                   roleId:
 *                     type: string
 *     responses:
 *       200:
 *         description: Bulk operation completed
 */
router.post('/bulk', 
    PermissionMiddleware.requirePermissions('update:staff'),
    StaffController.bulkOperations
);

// ========================================
// PERMISSION CHECKING
// ========================================

/**
 * @swagger
 * /api/v2/staff/{id}/permissions:
 *   get:
 *     summary: Get staff member's permissions
 *     tags: [Staff]
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
 *         description: Permissions retrieved successfully
 */
router.get('/:id/permissions', 
    PermissionMiddleware.requireOwnershipOrPermission('_id', 'read:permissions'),
    StaffController.getStaffPermissions
);

/**
 * @swagger
 * /api/v2/staff/{id}/check-permission:
 *   post:
 *     summary: Check if staff member has specific permission
 *     tags: [Staff]
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
 *               - permission
 *             properties:
 *               permission:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permission check completed
 */
router.post('/:id/check-permission', 
    PermissionMiddleware.requirePermissions('read:permissions'),
    StaffController.checkStaffPermission
);

module.exports = router;