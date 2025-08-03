const Role = require('../model/RoleModel');
const CustomError = require('../utils/customError');

const checkPermission = (...requiredPermissions) => {
    return async (req, res, next) => {
        try {
            // Ensure user and role exist in request (set by authMiddleware)
            if (!req.user || !req.user.defaultrole) {
                throw new CustomError('Authentication required', 401);
            }

            // Get user's role with populated permissions
            const userRole = await Role.findOne({ name: req.user.defaultrole })
                .populate('permissions');

            if (!userRole) {
                throw new CustomError('Role not found', 404);
            }

            // Extract permission names from the user's role
            const userPermissions = userRole.permissions.map(p => p.name);

            // Check if user has all required permissions
            const hasPermission = requiredPermissions.every(permission =>
                userPermissions.includes(permission)
            );

            if (!hasPermission) {
                throw new CustomError('You do not have the required permissions', 403);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = checkPermission;