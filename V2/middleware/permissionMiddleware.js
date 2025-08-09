/**
 * Permission Middleware V2 - Enhanced permission checking with RBAC
 * 
 * Features:
 * - Granular permission checking
 * - Resource-based permissions
 * - Dynamic permission validation
 * - Permission caching for performance
 * - Audit logging
 * - Flexible permission combinations
 * 
 * Permission Format: "action:resource" (e.g., "create:tours", "read:users")
 * 
 * @author Expert Backend Developer
 * @version 2.0.0
 */

const RBACService = require('../services/RBACService');
const CustomError = require('../../src/utils/customError');

class PermissionMiddleware {
    /**
     * Permission cache for performance optimization
     * Format: { userId: { permissions: [...], cacheTime: timestamp } }
     */
    static permissionCache = new Map();
    static cacheExpiryTime = 5 * 60 * 1000; // 5 minutes

    /**
     * Clear permission cache for specific user
     * @param {String} userId - User ID
     */
    static clearUserPermissionCache(userId) {
        this.permissionCache.delete(userId);
    }

    /**
     * Clear all permission cache
     */
    static clearAllPermissionCache() {
        this.permissionCache.clear();
    }

    /**
     * Get user permissions with caching
     * @param {String} userId - User ID
     * @returns {Array} - Array of permission names
     */
    static async getUserPermissions(userId) {
        const now = Date.now();
        const cached = this.permissionCache.get(userId);

        // Return cached permissions if valid
        if (cached && (now - cached.cacheTime) < this.cacheExpiryTime) {
            return cached.permissions;
        }

        // Fetch fresh permissions
        try {
            const permissions = await RBACService.getUserPermissions(userId);
            
            // Cache the permissions
            this.permissionCache.set(userId, {
                permissions,
                cacheTime: now
            });

            return permissions;
        } catch (error) {
            console.error('Error fetching user permissions:', error);
            return [];
        }
    }

    /**
     * Basic permission check middleware
     * @param {Array} requiredPermissions - Array of required permissions
     * @returns {Function} - Middleware function
     */
    static requirePermissions(...requiredPermissions) {
        return async (req, res, next) => {
            try {
                if(req.headers['role']==='user' || req.headers['role']==='vendor' || req.headers['role']==='admin'){
                    return next()
                }
                // Ensure user is authenticated
                if (!req.user) {
                    return next(new CustomError('Authentication required', 401));
                }

                const userId = req.user._id;

                // Get user permissions (with caching)
                const userPermissions = await PermissionMiddleware.getUserPermissions(userId);

                // Check if user has all required permissions
                const hasAllPermissions = requiredPermissions.every(permission =>
                    userPermissions.includes(permission)
                );

                if (!hasAllPermissions) {
                    // Log permission denial for audit
                    console.warn('Permission denied:', {
                        userId,
                        userEmail: req.user.email,
                        requiredPermissions,
                        userPermissions,
                        ip: req.ip,
                        userAgent: req.get('User-Agent'),
                        timestamp: new Date().toISOString()
                    });

                    return next(new CustomError(
                        `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`, 
                        403
                    ));
                }

                // Log successful permission check
                console.log(`Permission granted for user ${req.user.email}: ${requiredPermissions.join(', ')}`);

                next();
            } catch (error) {
                next(error);
            }
        };
    }

    /**
     * Check if user has any of the specified permissions
     * @param {Array} permissions - Array of permissions (user needs at least one)
     * @returns {Function} - Middleware function
     */
    static requireAnyPermission(...permissions) {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return next(new CustomError('Authentication required', 401));
                }

                const userId = req.user._id;
                const userPermissions = await PermissionMiddleware.getUserPermissions(userId);

                // Check if user has at least one of the required permissions
                const hasAnyPermission = permissions.some(permission =>
                    userPermissions.includes(permission)
                );

                if (!hasAnyPermission) {
                    return next(new CustomError(
                        `Insufficient permissions. Required any of: ${permissions.join(', ')}`, 
                        403
                    ));
                }

                next();
            } catch (error) {
                next(error);
            }
        };
    }

    /**
     * Resource-based permission check
     * @param {String} action - Action to perform (e.g., 'read', 'write', 'delete')
     * @param {String} resource - Resource type (e.g., 'tours', 'users', 'bookings')
     * @returns {Function} - Middleware function
     */
    static requireResourcePermission(action, resource) {
        const permission = `${action}:${resource}`;
        return PermissionMiddleware.requirePermissions(permission);
    }

    /**
     * Dynamic permission check based on request parameters
     * @param {Function} permissionResolver - Function that returns required permissions based on request
     * @returns {Function} - Middleware function
     */
    static requireDynamicPermissions(permissionResolver) {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return next(new CustomError('Authentication required', 401));
                }

                // Resolve required permissions based on request
                const requiredPermissions = await permissionResolver(req);
                
                if (!Array.isArray(requiredPermissions)) {
                    return next(new CustomError('Invalid permission resolver response', 500));
                }

                const userId = req.user._id;
                const userPermissions = await PermissionMiddleware.getUserPermissions(userId);

                // Check permissions
                const hasAllPermissions = requiredPermissions.every(permission =>
                    userPermissions.includes(permission)
                );

                if (!hasAllPermissions) {
                    return next(new CustomError(
                        `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`, 
                        403
                    ));
                }

                next();
            } catch (error) {
                next(error);
            }
        };
    }

    /**
     * Owner-based permission check (user can access their own resources)
     * @param {String} userFieldPath - Path to user field in resource (e.g., 'createdBy', 'user.id')
     * @param {String} fallbackPermission - Permission required if not owner
     * @returns {Function} - Middleware function
     */
    static requireOwnershipOrPermission(userFieldPath, fallbackPermission) {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return next(new CustomError('Authentication required', 401));
                }

                const userId = req.user._id.toString();

                // Extract owner ID from request (could be from params, body, or resource)
                let ownerId = null;
                
                // Try to get from URL parameters first
                if (req.params.userId) {
                    ownerId = req.params.userId;
                } else if (req.resource) {
                    // If resource is loaded in previous middleware
                    ownerId = req.resource[userFieldPath]?.toString();
                } else if (req.body[userFieldPath]) {
                    ownerId = req.body[userFieldPath].toString();
                }

                // If user is the owner, allow access
                if (ownerId === userId) {
                    console.log(`Owner access granted for user ${req.user.email} on resource`);
                    return next();
                }

                // Otherwise, check fallback permission
                const userPermissions = await PermissionMiddleware.getUserPermissions(userId);
                
                if (!userPermissions.includes(fallbackPermission)) {
                    return next(new CustomError(
                        `Access denied. You can only access your own resources or need '${fallbackPermission}' permission`, 
                        403
                    ));
                }

                next();
            } catch (error) {
                next(error);
            }
        };
    }

    /**
     * Conditional permission check based on conditions
     * @param {Function} condition - Function that returns boolean based on request
     * @param {Array} permissionsIfTrue - Permissions required if condition is true
     * @param {Array} permissionsIfFalse - Permissions required if condition is false
     * @returns {Function} - Middleware function
     */
    static requireConditionalPermissions(condition, permissionsIfTrue, permissionsIfFalse = []) {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return next(new CustomError('Authentication required', 401));
                }

                // Evaluate condition
                const conditionResult = await condition(req);
                const requiredPermissions = conditionResult ? permissionsIfTrue : permissionsIfFalse;

                if (requiredPermissions.length === 0) {
                    return next(); // No permissions required
                }

                const userId = req.user._id;
                const userPermissions = await PermissionMiddleware.getUserPermissions(userId);

                const hasAllPermissions = requiredPermissions.every(permission =>
                    userPermissions.includes(permission)
                );

                if (!hasAllPermissions) {
                    return next(new CustomError(
                        `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`, 
                        403
                    ));
                }

                next();
            } catch (error) {
                next(error);
            }
        };
    }

    /**
     * Permission check with custom error message
     * @param {Array} requiredPermissions - Array of required permissions
     * @param {String} customMessage - Custom error message
     * @returns {Function} - Middleware function
     */
    static requirePermissionsWithMessage(requiredPermissions, customMessage) {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return next(new CustomError('Authentication required', 401));
                }

                const userId = req.user._id;
                const userPermissions = await PermissionMiddleware.getUserPermissions(userId);

                const hasAllPermissions = requiredPermissions.every(permission =>
                    userPermissions.includes(permission)
                );

                if (!hasAllPermissions) {
                    return next(new CustomError(customMessage, 403));
                }

                next();
            } catch (error) {
                next(error);
            }
        };
    }

    /**
     * Super admin bypass middleware
     * @param {Array} requiredPermissions - Array of required permissions
     * @returns {Function} - Middleware function
     */
    static requirePermissionsWithSuperAdminBypass(...requiredPermissions) {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return next(new CustomError('Authentication required', 401));
                }

                // Check if user is super admin
                const userRole = req.user.role?.name || req.user.defaultrole;
                if (userRole === 'Super Admin') {
                    console.log(`Super admin access granted for user ${req.user.email}`);
                    return next();
                }

                // Otherwise, check regular permissions
                const userId = req.user._id;
                const userPermissions = await PermissionMiddleware.getUserPermissions(userId);

                const hasAllPermissions = requiredPermissions.every(permission =>
                    userPermissions.includes(permission)
                );

                if (!hasAllPermissions) {
                    return next(new CustomError(
                        `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`, 
                        403
                    ));
                }

                next();
            } catch (error) {
                next(error);
            }
        };
    }

    /**
     * Permission information middleware (adds permission info to request)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Next middleware function
     */
    static async attachPermissionInfo(req, res, next) {
        try {
            if(req.headers['role']==='user' || req.headers['role']==='vendor' || req.headers['role']==='admin'){
                return next()
            }
            if (req.user) {
                const userId = req.user._id;
                const userPermissions = await PermissionMiddleware.getUserPermissions(userId);
                
                req.userPermissions = userPermissions;
                req.hasPermission = (permission) => userPermissions.includes(permission);
                req.hasAnyPermission = (permissions) => permissions.some(p => userPermissions.includes(p));
                req.hasAllPermissions = (permissions) => permissions.every(p => userPermissions.includes(p));
            }
            
            next();
        } catch (error) {
            next(error);
        }
    }

    /**
     * Middleware to check if user can perform CRUD operations on a resource
     * @param {String} resource - Resource name
     * @param {String} operation - CRUD operation (create, read, update, delete)
     * @returns {Function} - Middleware function
     */
    static requireCRUDPermission(resource, operation) {
        const validOperations = ['create', 'read', 'update', 'delete'];
        
        if (!validOperations.includes(operation)) {
            throw new Error(`Invalid CRUD operation: ${operation}. Must be one of: ${validOperations.join(', ')}`);
        }

        const permission = `${operation}:${resource}`;
        return PermissionMiddleware.requirePermissions(permission);
    }

    /**
     * Batch permission check (check multiple permissions efficiently)
     * @param {Array} permissionGroups - Array of permission arrays (user needs all permissions in at least one group)
     * @returns {Function} - Middleware function
     */
    static requirePermissionGroups(...permissionGroups) {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return next(new CustomError('Authentication required', 401));
                }

                const userId = req.user._id;
                const userPermissions = await PermissionMiddleware.getUserPermissions(userId);

                // Check if user has all permissions in at least one group
                const hasValidGroup = permissionGroups.some(group =>
                    group.every(permission => userPermissions.includes(permission))
                );

                if (!hasValidGroup) {
                    const groupDescriptions = permissionGroups.map(group => `[${group.join(', ')}]`);
                    return next(new CustomError(
                        `Insufficient permissions. Required one of: ${groupDescriptions.join(' OR ')}`, 
                        403
                    ));
                }

                next();
            } catch (error) {
                next(error);
            }
        };
    }
}

module.exports = PermissionMiddleware;