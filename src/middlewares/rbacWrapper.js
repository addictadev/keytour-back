/**
 * RBAC Permission Wrapper Middleware
 * 
 * This middleware provides a production-safe way to add permission checks
 * to existing routes without changing the underlying logic or responses.
 * It checks permissions only if RBAC is enabled and configured.
 * 
 * @author Expert Backend Developer
 * @version 1.0.0
 */

const { checkPermission } = require('./checkPermission');

/**
 * Create a permission checking wrapper that falls back gracefully
 * @param {String|Array} requiredPermissions - Permission(s) required
 * @param {Object} options - Additional options
 * @returns {Function} Middleware function
 */
const rbacWrapper = (requiredPermissions, options = {}) => {
    return async (req, res, next) => {
        try {
            // Check if RBAC is enabled (environment variable)
            const rbacEnabled = process.env.ENABLE_RBAC === 'true' || process.env.NODE_ENV === 'production';
            
            if (!rbacEnabled) {
                // Skip permission check in development if RBAC is not enabled
                return next();
            }

            // Check if user is authenticated
            if (!req.user) {
                // If no user, use existing auth middleware behavior
                return next();
            }

            // Check if user has required permissions
            const hasPermission = await checkPermissionLogic(req.user, requiredPermissions);
            
            if (!hasPermission) {
                // Use the same error format as existing system
                return res.status(403).json({
                    status: 'fail',
                    message: 'You do not have permission to perform this action'
                });
            }

            // Permission granted, continue
            next();
        } catch (error) {
            // In case of any error, fail open in production to avoid breaking existing functionality
            console.error('RBAC permission check error:', error);
            
            if (process.env.NODE_ENV === 'development') {
                return res.status(500).json({
                    status: 'error',
                    message: 'Permission check failed',
                    error: error.message
                });
            }
            
            // In production, log the error but continue
            next();
        }
    };
};

/**
 * Check if user has required permissions
 * Compatible with both old and new permission systems
 */
async function checkPermissionLogic(user, requiredPermissions) {
    // Convert single permission to array for consistency
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    
    // Quick check: If user is admin (by defaultrole), grant all permissions
    if (user.defaultrole === 'admin') {
        return true;
    }
    
    // Check if using new V2 multi-role system
    if (user.roles && Array.isArray(user.roles)) {
        // New multi-role system
        const Role = require('../model/RoleModel');
        const Permission = require('../model/PermissionsModel');
        
        // Get all permissions from all roles
        const allPermissions = new Set();
        
        for (const roleId of user.roles) {
            try {
                const role = await Role.findById(roleId).populate('permissions');
                if (role && role.permissions) {
                    role.permissions.forEach(perm => {
                        allPermissions.add(perm.name);
                    });
                }
            } catch (err) {
                console.error('Error populating role:', err.message);
            }
        }
        
        // Check if user has any of the required permissions
        return permissions.some(permission => allPermissions.has(permission));
    } 
    
    // Check if using old single-role system
    if (user.role || user.defaultrole) {
        const Role = require('../model/RoleModel');
        
        try {
            // Handle case where role might be a string ID or populated object
            let roleId;
            if (typeof user.role === 'string') {
                roleId = user.role;
            } else if (user.role && user.role._id) {
                roleId = user.role._id;
            } else if (user.defaultrole) {
                // For admin users with defaultrole
                return user.defaultrole === 'admin'; // Simple check for admin
            }
            
            if (roleId) {
                const role = await Role.findById(roleId).populate('permissions');
                if (!role || !role.permissions) {
                    return false;
                }
                
                const userPermissions = role.permissions.map(p => p.name);
                return permissions.some(permission => userPermissions.includes(permission));
            }
        } catch (error) {
            console.error('Error checking role permissions:', error.message);
            // For admin users, return true if they have defaultrole = 'admin'
            if (user.defaultrole === 'admin') {
                return true;
            }
        }
    }
    
    // If no role system detected, check if user is admin (backward compatibility)
    if (user.isAdmin || user.role === 'admin' || user.type === 'admin') {
        return true;
    }
    
    return false;
}

/**
 * Middleware to check for any of the permissions (OR logic)
 */
rbacWrapper.any = (permissions) => {
    return rbacWrapper(permissions, { logic: 'any' });
};

/**
 * Middleware to check for all permissions (AND logic)
 */
rbacWrapper.all = (permissions) => {
    return async (req, res, next) => {
        try {
            const rbacEnabled = process.env.ENABLE_RBAC === 'true' || process.env.NODE_ENV === 'production';
            
            if (!rbacEnabled || !req.user) {
                return next();
            }

            // Check all permissions
            for (const permission of permissions) {
                const hasPermission = await checkPermissionLogic(req.user, permission);
                if (!hasPermission) {
                    return res.status(403).json({
                        status: 'fail',
                        message: 'You do not have permission to perform this action'
                    });
                }
            }

            next();
        } catch (error) {
            console.error('RBAC permission check error:', error);
            next();
        }
    };
};

module.exports = rbacWrapper;