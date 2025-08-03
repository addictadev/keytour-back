const Permission = require('../model/PermissionsModel');
const Role = require('../model/RoleModel');
const response = require('../utils/response');
const catchAsync = require('../utils/catchAsync');
const CustomError = require('../utils/customError');

class PermissionController {
    getAllPermissions = catchAsync(async (req, res) => {
        const permissions = await Permission.find().sort('name');
        response(res, 200, permissions, 'Permissions retrieved successfully');
    });

    getAllRoles = catchAsync(async (req, res) => {
        const roles = await Role.find()
            .populate('permissions')
            .sort('name');
        response(res, 200, roles, 'Roles retrieved successfully');
    });

    getRoleById = catchAsync(async (req, res) => {
        const role = await Role.findById(req.params.id)
            .populate('permissions');
        
        if (!role) {
            throw new CustomError('Role not found', 404);
        }

        response(res, 200, role, 'Role retrieved successfully');
    });

    updateRolePermissions = catchAsync(async (req, res) => {
        const { permissions } = req.body;
        const role = await Role.findByIdAndUpdate(
            req.params.id,
            { permissions },
            { new: true, runValidators: true }
        ).populate('permissions');

        if (!role) {
            throw new CustomError('Role not found', 404);
        }

        response(res, 200, role, 'Role permissions updated successfully');
    });
}

module.exports = new PermissionController();