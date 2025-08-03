/**
 * RBAC Controller V2 - Role and Permission management endpoints
 * 
 * Features:
 * - Complete role CRUD operations
 * - Permission management
 * - Role assignment
 * - Permission checking
 * - Bulk operations
 * - System initialization
 * 
 * @author Expert Backend Developer
 * @version 2.0.0
 */

const RBACService = require('../services/RBACService');
const CustomError = require('../../src/utils/customError');
const response = require('../../src/utils/response');
const catchAsync = require('../../src/utils/catchAsync');

class RBACController {
    // ========================================
    // PERMISSION MANAGEMENT
    // ========================================

    /**
     * Get all permissions with pagination
     * @route GET /api/v2/rbac/permissions
     */
    static getAllPermissions = catchAsync(async (req, res, next) => {
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 50,
            sortBy: req.query.sortBy || 'name',
            sortOrder: req.query.sortOrder || 'asc',
            search: req.query.search || ''
        };

        const result = await RBACService.getPermissions(options);

        response(res, 200, result, 'Permissions retrieved successfully');
    });

    /**
     * Create new permission
     * @route POST /api/v2/rbac/permissions
     */
    static createPermission = catchAsync(async (req, res, next) => {
        const { name, description } = req.body;

        if (!name) {
            return next(new CustomError('Permission name is required', 400));
        }

        const permission = await RBACService.createPermission({ name, description });

        response(res, 201, { permission }, 'Permission created successfully');
    });

    /**
     * Update permission
     * @route PUT /api/v2/rbac/permissions/:id
     */
    static updatePermission = catchAsync(async (req, res, next) => {
        const { id } = req.params;
        const updateData = req.body;

        if (!id) {
            return next(new CustomError('Permission ID is required', 400));
        }

        if (Object.keys(updateData).length === 0) {
            return next(new CustomError('No update data provided', 400));
        }

        const permission = await RBACService.updatePermission(id, updateData);

        response(res, 200, { permission }, 'Permission updated successfully');
    });

    /**
     * Delete permission
     * @route DELETE /api/v2/rbac/permissions/:id
     */
    static deletePermission = catchAsync(async (req, res, next) => {
        const { id } = req.params;

        if (!id) {
            return next(new CustomError('Permission ID is required', 400));
        }

        await RBACService.deletePermission(id);

        response(res, 200, null, 'Permission deleted successfully');
    });

    // ========================================
    // ROLE MANAGEMENT
    // ========================================

    /**
     * Get all roles with pagination
     * @route GET /api/v2/rbac/roles
     */
    static getAllRoles = catchAsync(async (req, res, next) => {
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            sortBy: req.query.sortBy || 'name',
            sortOrder: req.query.sortOrder || 'asc',
            search: req.query.search || '',
            includePermissions: req.query.includePermissions !== 'false'
        };

        const result = await RBACService.getRoles(options);

        response(res, 200, result, 'Roles retrieved successfully');
    });

    /**
     * Get role by ID
     * @route GET /api/v2/rbac/roles/:id
     */
    static getRoleById = catchAsync(async (req, res, next) => {
        const { id } = req.params;

        if (!id) {
            return next(new CustomError('Role ID is required', 400));
        }

        const role = await RBACService.getRoleById(id);

        response(res, 200, { role }, 'Role retrieved successfully');
    });

    /**
     * Create new role
     * @route POST /api/v2/rbac/roles
     */
    static createRole = catchAsync(async (req, res, next) => {
        const { name, permissions = [], description } = req.body;

        if (!name) {
            return next(new CustomError('Role name is required', 400));
        }

        const role = await RBACService.createRole({ name, permissions, description });

        response(res, 201, { role }, 'Role created successfully');
    });

    /**
     * Update role
     * @route PUT /api/v2/rbac/roles/:id
     */
    static updateRole = catchAsync(async (req, res, next) => {
        const { id } = req.params;
        const updateData = req.body;

        if (!id) {
            return next(new CustomError('Role ID is required', 400));
        }

        if (Object.keys(updateData).length === 0) {
            return next(new CustomError('No update data provided', 400));
        }

        const role = await RBACService.updateRole(id, updateData);

        response(res, 200, { role }, 'Role updated successfully');
    });

    /**
     * Delete role
     * @route DELETE /api/v2/rbac/roles/:id
     */
    static deleteRole = catchAsync(async (req, res, next) => {
        const { id } = req.params;

        if (!id) {
            return next(new CustomError('Role ID is required', 400));
        }

        await RBACService.deleteRole(id);

        response(res, 200, null, 'Role deleted successfully');
    });

    /**
     * Add permissions to role
     * @route POST /api/v2/rbac/roles/:id/permissions
     */
    static addPermissionsToRole = catchAsync(async (req, res, next) => {
        const { id } = req.params;
        const { permissions } = req.body;

        if (!id) {
            return next(new CustomError('Role ID is required', 400));
        }

        if (!Array.isArray(permissions) || permissions.length === 0) {
            return next(new CustomError('Permissions array is required', 400));
        }

        // Get current role
        const role = await RBACService.getRoleById(id);
        const currentPermissions = role.permissions.map(p => p._id.toString());
        
        // Merge with new permissions (avoid duplicates)
        const updatedPermissions = [...new Set([...currentPermissions, ...permissions])];

        const updatedRole = await RBACService.updateRole(id, { permissions: updatedPermissions });

        response(res, 200, { role: updatedRole }, 'Permissions added to role successfully');
    });

    /**
     * Remove permissions from role
     * @route DELETE /api/v2/rbac/roles/:id/permissions
     */
    static removePermissionsFromRole = catchAsync(async (req, res, next) => {
        const { id } = req.params;
        const { permissions } = req.body;

        if (!id) {
            return next(new CustomError('Role ID is required', 400));
        }

        if (!Array.isArray(permissions) || permissions.length === 0) {
            return next(new CustomError('Permissions array is required', 400));
        }

        // Get current role
        const role = await RBACService.getRoleById(id);
        const currentPermissions = role.permissions.map(p => p._id.toString());
        
        // Remove specified permissions
        const updatedPermissions = currentPermissions.filter(p => !permissions.includes(p));

        const updatedRole = await RBACService.updateRole(id, { permissions: updatedPermissions });

        response(res, 200, { role: updatedRole }, 'Permissions removed from role successfully');
    });

    // ========================================
    // PERMISSION CHECKING
    // ========================================

    /**
     * Check if user has permission
     * @route POST /api/v2/rbac/check-permission
     */
    static checkPermission = catchAsync(async (req, res, next) => {
        const { userId, permission } = req.body;

        if (!userId || !permission) {
            return next(new CustomError('User ID and permission are required', 400));
        }

        const hasPermission = await RBACService.hasPermission(userId, permission);

        response(res, 200, {
            userId,
            permission,
            hasPermission
        }, 'Permission check completed');
    });

    /**
     * Check if user has any of the permissions
     * @route POST /api/v2/rbac/check-any-permission
     */
    static checkAnyPermission = catchAsync(async (req, res, next) => {
        const { userId, permissions } = req.body;

        if (!userId || !Array.isArray(permissions) || permissions.length === 0) {
            return next(new CustomError('User ID and permissions array are required', 400));
        }

        const hasAnyPermission = await RBACService.hasAnyPermission(userId, permissions);

        response(res, 200, {
            userId,
            permissions,
            hasAnyPermission
        }, 'Permission check completed');
    });

    /**
     * Check if user has all permissions
     * @route POST /api/v2/rbac/check-all-permissions
     */
    static checkAllPermissions = catchAsync(async (req, res, next) => {
        const { userId, permissions } = req.body;

        if (!userId || !Array.isArray(permissions) || permissions.length === 0) {
            return next(new CustomError('User ID and permissions array are required', 400));
        }

        const hasAllPermissions = await RBACService.hasAllPermissions(userId, permissions);

        response(res, 200, {
            userId,
            permissions,
            hasAllPermissions
        }, 'Permission check completed');
    });

    /**
     * Get user permissions
     * @route GET /api/v2/rbac/user/:userId/permissions
     */
    static getUserPermissions = catchAsync(async (req, res, next) => {
        const { userId } = req.params;

        if (!userId) {
            return next(new CustomError('User ID is required', 400));
        }

        const permissions = await RBACService.getUserPermissions(userId);

        response(res, 200, {
            userId,
            permissions
        }, 'User permissions retrieved successfully');
    });

    // ========================================
    // ROLE ASSIGNMENT
    // ========================================

    /**
     * Assign role to staff member
     * @route POST /api/v2/rbac/assign-role
     */
    static assignRole = catchAsync(async (req, res, next) => {
        const { staffId, roleId } = req.body;

        if (!staffId || !roleId) {
            return next(new CustomError('Staff ID and Role ID are required', 400));
        }

        const assignedBy = req.user._id;
        const staff = await RBACService.assignRoleToStaff(staffId, roleId, assignedBy);

        response(res, 200, { staff }, 'Role assigned successfully');
    });

    /**
     * Remove role from staff member
     * @route POST /api/v2/rbac/remove-role
     */
    static removeRole = catchAsync(async (req, res, next) => {
        const { staffId, roleId } = req.body;

        if (!staffId || !roleId) {
            return next(new CustomError('Staff ID and Role ID are required', 400));
        }

        const removedBy = req.user._id;
        const staff = await RBACService.removeRoleFromStaff(staffId, roleId, removedBy);

        response(res, 200, { staff }, 'Role removed successfully');
    });

    /**
     * Add additional role to staff member
     * @route POST /api/v2/rbac/add-additional-role
     */
    static addAdditionalRole = catchAsync(async (req, res, next) => {
        const { staffId, roleId } = req.body;

        if (!staffId || !roleId) {
            return next(new CustomError('Staff ID and Role ID are required', 400));
        }

        const assignedBy = req.user._id;
        const staff = await RBACService.addAdditionalRoleToStaff(staffId, roleId, assignedBy);

        response(res, 200, { staff }, 'Additional role added successfully');
    });

    /**
     * Set primary role for staff member
     * @route POST /api/v2/rbac/set-primary-role
     */
    static setPrimaryRole = catchAsync(async (req, res, next) => {
        const { staffId, roleId } = req.body;

        if (!staffId || !roleId) {
            return next(new CustomError('Staff ID and Role ID are required', 400));
        }

        const updatedBy = req.user._id;
        const staff = await RBACService.setPrimaryRoleForStaff(staffId, roleId, updatedBy);

        response(res, 200, { staff }, 'Primary role set successfully');
    });

    /**
     * Get all roles for a staff member
     * @route GET /api/v2/rbac/staff/:staffId/roles
     */
    static getStaffRoles = catchAsync(async (req, res, next) => {
        const { staffId } = req.params;

        if (!staffId) {
            return next(new CustomError('Staff ID is required', 400));
        }

        const staffRoles = await RBACService.getStaffRoles(staffId);

        response(res, 200, { 
            staff: staffRoles.staff,
            primaryRole: staffRoles.primaryRole,
            additionalRoles: staffRoles.additionalRoles,
            allPermissions: staffRoles.allPermissions
        }, 'Staff roles retrieved successfully');
    });

    /**
     * Bulk assign roles to multiple staff members
     * @route POST /api/v2/rbac/bulk-assign-roles
     */
    static bulkAssignRoles = catchAsync(async (req, res, next) => {
        const { assignments } = req.body;

        if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
            return next(new CustomError('Assignments array is required', 400));
        }

        const assignedBy = req.user._id;
        const results = await RBACService.bulkAssignRoles(assignments, assignedBy);

        response(res, 200, results, 'Bulk role assignment completed');
    });

    // ========================================
    // BULK OPERATIONS
    // ========================================

    /**
     * Bulk create permissions
     * @route POST /api/v2/rbac/permissions/bulk
     */
    static bulkCreatePermissions = catchAsync(async (req, res, next) => {
        const { permissions } = req.body;

        if (!Array.isArray(permissions) || permissions.length === 0) {
            return next(new CustomError('Permissions array is required', 400));
        }

        const results = [];
        
        for (const permissionData of permissions) {
            try {
                const permission = await RBACService.createPermission(permissionData);
                results.push({ success: true, permission });
            } catch (error) {
                results.push({ success: false, error: error.message, data: permissionData });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        response(res, 200, {
            results,
            summary: {
                total: permissions.length,
                successful: successCount,
                failed: failureCount
            }
        }, `Bulk permission creation completed. ${successCount} successful, ${failureCount} failed`);
    });

    /**
     * Bulk create roles
     * @route POST /api/v2/rbac/roles/bulk
     */
    static bulkCreateRoles = catchAsync(async (req, res, next) => {
        const { roles } = req.body;

        if (!Array.isArray(roles) || roles.length === 0) {
            return next(new CustomError('Roles array is required', 400));
        }

        const results = [];
        
        for (const roleData of roles) {
            try {
                const role = await RBACService.createRole(roleData);
                results.push({ success: true, role });
            } catch (error) {
                results.push({ success: false, error: error.message, data: roleData });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        response(res, 200, {
            results,
            summary: {
                total: roles.length,
                successful: successCount,
                failed: failureCount
            }
        }, `Bulk role creation completed. ${successCount} successful, ${failureCount} failed`);
    });

    // ========================================
    // SYSTEM INITIALIZATION
    // ========================================

    /**
     * Initialize RBAC system with default permissions and roles
     * @route POST /api/v2/rbac/initialize
     */
    static initializeRBAC = catchAsync(async (req, res, next) => {
        try {
            // Create default permissions
            const permissions = await RBACService.createDefaultPermissions();
            
            // Create default roles
            const roles = await RBACService.createDefaultRoles();

            response(res, 200, {
                permissions: {
                    created: permissions.length,
                    items: permissions
                },
                roles: {
                    created: roles.length,
                    items: roles
                }
            }, 'RBAC system initialized successfully');
        } catch (error) {
            next(error);
        }
    });

    // ========================================
    // SYSTEM INFORMATION
    // ========================================

    /**
     * Get RBAC system overview
     * @route GET /api/v2/rbac/overview
     */
    static getSystemOverview = catchAsync(async (req, res, next) => {
        const [permissionsResult, rolesResult] = await Promise.all([
            RBACService.getPermissions({ page: 1, limit: 1 }),
            RBACService.getRoles({ page: 1, limit: 1, includePermissions: false })
        ]);

        const overview = {
            permissions: {
                total: permissionsResult.pagination.total
            },
            roles: {
                total: rolesResult.pagination.total
            },
            features: [
                'Role-Based Access Control',
                'Granular Permissions',
                'Dynamic Permission Checking',
                'Bulk Operations',
                'Audit Trail Support',
                'Performance Optimized'
            ],
            version: '2.0.0'
        };

        response(res, 200, { overview }, 'RBAC system overview retrieved successfully');
    });

    /**
     * Get permission usage statistics
     * @route GET /api/v2/rbac/permissions/statistics
     */
    static getPermissionStatistics = catchAsync(async (req, res, next) => {
        // Note: This would require additional queries to get usage statistics
        // For now, we'll return basic information
        
        const permissionsResult = await RBACService.getPermissions({ 
            page: 1, 
            limit: 1000 // Get all permissions
        });

        const statistics = {
            total: permissionsResult.pagination.total,
            byCategory: {},
            mostUsed: [], // Would need additional tracking
            leastUsed: [] // Would need additional tracking
        };

        // Group permissions by category (action part)
        permissionsResult.permissions.forEach(permission => {
            const [action] = permission.name.split(':');
            if (!statistics.byCategory[action]) {
                statistics.byCategory[action] = 0;
            }
            statistics.byCategory[action]++;
        });

        response(res, 200, { statistics }, 'Permission statistics retrieved successfully');
    });

    /**
     * Get role usage statistics
     * @route GET /api/v2/rbac/roles/statistics
     */
    static getRoleStatistics = catchAsync(async (req, res, next) => {
        // Note: This would require additional queries to count staff members per role
        // For now, we'll return basic information
        
        const rolesResult = await RBACService.getRoles({ 
            page: 1, 
            limit: 1000, // Get all roles
            includePermissions: true
        });

        const statistics = {
            total: rolesResult.pagination.total,
            byPermissionCount: {},
            averagePermissionsPerRole: 0
        };

        let totalPermissions = 0;
        
        rolesResult.roles.forEach(role => {
            const permissionCount = role.permissions.length;
            totalPermissions += permissionCount;
            
            const bucket = Math.floor(permissionCount / 5) * 5; // Group by 5s
            const bucketKey = `${bucket}-${bucket + 4}`;
            
            if (!statistics.byPermissionCount[bucketKey]) {
                statistics.byPermissionCount[bucketKey] = 0;
            }
            statistics.byPermissionCount[bucketKey]++;
        });

        statistics.averagePermissionsPerRole = rolesResult.pagination.total > 0 
            ? Math.round(totalPermissions / rolesResult.pagination.total * 100) / 100 
            : 0;

        response(res, 200, { statistics }, 'Role statistics retrieved successfully');
    });
}

module.exports = RBACController;