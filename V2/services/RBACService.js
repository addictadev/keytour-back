/**
 * RBAC Service - Role-Based Access Control management
 * 
 * Implements SOLID principles:
 * - S: Single Responsibility - Handles only RBAC logic
 * - O: Open/Closed - Extensible for new permission types
 * - L: Liskov Substitution - Consistent interface
 * - I: Interface Segregation - Focused methods
 * - D: Dependency Inversion - Depends on abstractions
 * 
 * @author Expert Backend Developer
 * @version 2.0.0
 */

const Staff = require('../models/StaffModel');
const Role = require('../../src/model/RoleModel');
const Permission = require('../../src/model/PermissionsModel');
const CustomError = require('../../src/utils/customError');

class RBACService {
    /**
     * Permission Management
     */

    /**
     * Create a new permission
     * @param {Object} permissionData - Permission data
     * @returns {Object} - Created permission
     */
    static async createPermission(permissionData) {
        const { name, description } = permissionData;

        // Validate permission name format (e.g., "action:resource")
        const permissionRegex = /^[a-z_]+:[a-z_]+$/;
        if (!permissionRegex.test(name)) {
            throw new CustomError('Permission name must follow format "action:resource" (e.g., "create:tours")', 400);
        }

        // Check if permission already exists
        const existingPermission = await Permission.findOne({ name });
        if (existingPermission) {
            throw new CustomError('Permission already exists', 409);
        }

        const permission = await Permission.create({
            name,
            description: description || `Permission to ${name.replace(':', ' ')}`
        });

        return permission;
    }

    /**
     * Get all permissions with pagination
     * @param {Object} options - Query options
     * @returns {Object} - Permissions with pagination
     */
    static async getPermissions(options = {}) {
        const {
            page = 1,
            limit = 50,
            sortBy = 'name',
            sortOrder = 'asc',
            search = ''
        } = options;

        const query = search ? { name: { $regex: search, $options: 'i' } } : {};
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const permissions = await Permission.find(query)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Permission.countDocuments(query);

        return {
            permissions,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Update permission
     * @param {String} permissionId - Permission ID
     * @param {Object} updateData - Update data
     * @returns {Object} - Updated permission
     */
    static async updatePermission(permissionId, updateData) {
        const permission = await Permission.findById(permissionId);
        
        if (!permission) {
            throw new CustomError('Permission not found', 404);
        }

        // If name is being updated, validate format and uniqueness
        if (updateData.name && updateData.name !== permission.name) {
            const permissionRegex = /^[a-z_]+:[a-z_]+$/;
            if (!permissionRegex.test(updateData.name)) {
                throw new CustomError('Permission name must follow format "action:resource"', 400);
            }

            const existingPermission = await Permission.findOne({ name: updateData.name });
            if (existingPermission) {
                throw new CustomError('Permission name already exists', 409);
            }
        }

        const updatedPermission = await Permission.findByIdAndUpdate(
            permissionId,
            updateData,
            { new: true, runValidators: true }
        );

        return updatedPermission;
    }

    /**
     * Delete permission (with safety checks)
     * @param {String} permissionId - Permission ID
     * @returns {Boolean} - Success status
     */
    static async deletePermission(permissionId) {
        const permission = await Permission.findById(permissionId);
        
        if (!permission) {
            throw new CustomError('Permission not found', 404);
        }

        // Check if permission is being used by any roles
        const rolesUsingPermission = await Role.find({ permissions: permissionId });
        
        if (rolesUsingPermission.length > 0) {
            throw new CustomError(
                `Cannot delete permission. It is being used by ${rolesUsingPermission.length} role(s)`, 
                409
            );
        }

        await Permission.findByIdAndDelete(permissionId);
        return true;
    }

    /**
     * Role Management
     */

    /**
     * Create a new role
     * @param {Object} roleData - Role data
     * @returns {Object} - Created role
     */
    static async createRole(roleData) {
        const { name, permissions = [], description } = roleData;

        // Check if role already exists
        const existingRole = await Role.findOne({ name });
        if (existingRole) {
            throw new CustomError('Role already exists', 409);
        }

        // Validate permissions exist
        if (permissions.length > 0) {
            const validPermissions = await Permission.find({ _id: { $in: permissions } });
            if (validPermissions.length !== permissions.length) {
                throw new CustomError('Some permissions do not exist', 400);
            }
        }

        const role = await Role.create({
            name,
            permissions,
            description
        });

        return role.populate('permissions');
    }

    /**
     * Get all roles with pagination
     * @param {Object} options - Query options
     * @returns {Object} - Roles with pagination
     */
    static async getRoles(options = {}) {
        const {
            page = 1,
            limit = 20,
            sortBy = 'name',
            sortOrder = 'asc',
            search = '',
            includePermissions = true
        } = options;

        const query = search ? { name: { $regex: search, $options: 'i' } } : {};
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        let rolesQuery = Role.find(query)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        if (includePermissions) {
            rolesQuery = rolesQuery.populate('permissions');
        }

        const roles = await rolesQuery;
        const total = await Role.countDocuments(query);

        return {
            roles,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get role by ID
     * @param {String} roleId - Role ID
     * @returns {Object} - Role with permissions
     */
    static async getRoleById(roleId) {
        const role = await Role.findById(roleId).populate('permissions');
        
        if (!role) {
            throw new CustomError('Role not found', 404);
        }

        return role;
    }

    /**
     * Update role
     * @param {String} roleId - Role ID
     * @param {Object} updateData - Update data
     * @returns {Object} - Updated role
     */
    static async updateRole(roleId, updateData) {
        const role = await Role.findById(roleId);
        
        if (!role) {
            throw new CustomError('Role not found', 404);
        }

        // If name is being updated, check uniqueness
        if (updateData.name && updateData.name !== role.name) {
            const existingRole = await Role.findOne({ name: updateData.name });
            if (existingRole) {
                throw new CustomError('Role name already exists', 409);
            }
        }

        // If permissions are being updated, validate they exist
        if (updateData.permissions) {
            const validPermissions = await Permission.find({ _id: { $in: updateData.permissions } });
            if (validPermissions.length !== updateData.permissions.length) {
                throw new CustomError('Some permissions do not exist', 400);
            }
        }

        const updatedRole = await Role.findByIdAndUpdate(
            roleId,
            updateData,
            { new: true, runValidators: true }
        ).populate('permissions');

        return updatedRole;
    }

    /**
     * Delete role (with safety checks)
     * @param {String} roleId - Role ID
     * @returns {Boolean} - Success status
     */
    static async deleteRole(roleId) {
        const role = await Role.findById(roleId);
        
        if (!role) {
            throw new CustomError('Role not found', 404);
        }

        // Check if role is being used by any staff members
        const staffUsingRole = await Staff.find({ role: roleId });
        
        if (staffUsingRole.length > 0) {
            throw new CustomError(
                `Cannot delete role. It is assigned to ${staffUsingRole.length} staff member(s)`, 
                409
            );
        }

        await Role.findByIdAndDelete(roleId);
        return true;
    }

    /**
     * Staff Role Assignment
     */

    /**
     * Assign role to staff member
     * @param {String} staffId - Staff ID
     * @param {String} roleId - Role ID
     * @param {String} assignedBy - ID of user making the assignment
     * @returns {Object} - Updated staff member
     */
    static async assignRoleToStaff(staffId, roleId, assignedBy) {
        const staff = await Staff.findById(staffId);
        const role = await Role.findById(roleId);

        if (!staff) {
            throw new CustomError('Staff member not found', 404);
        }

        if (!role) {
            throw new CustomError('Role not found', 404);
        }

        staff.role = roleId;
        staff.updatedBy = assignedBy;
        await staff.save();

        return staff.populate({
            path: 'role',
            populate: {
                path: 'permissions',
                model: 'Permission'
            }
        });
    }

    /**
     * Permission Checking
     */

    /**
     * Check if user has specific permission
     * @param {String} userId - User ID
     * @param {String} permission - Permission name
     * @returns {Boolean} - Has permission
     */
    static async hasPermission(userId, permission) {
        const staff = await Staff.findById(userId).populate({
            path: 'role',
            populate: {
                path: 'permissions',
                model: 'Permission'
            }
        });

        if (!staff || !staff.role) {
            return false;
        }

        const userPermissions = staff.role.permissions.map(p => p.name);
        return userPermissions.includes(permission);
    }

    /**
     * Check if user has any of the specified permissions
     * @param {String} userId - User ID
     * @param {Array} permissions - Array of permission names
     * @returns {Boolean} - Has any permission
     */
    static async hasAnyPermission(userId, permissions) {
        const staff = await Staff.findById(userId).populate({
            path: 'role',
            populate: {
                path: 'permissions',
                model: 'Permission'
            }
        });

        if (!staff || !staff.role) {
            return false;
        }

        const userPermissions = staff.role.permissions.map(p => p.name);
        return permissions.some(permission => userPermissions.includes(permission));
    }

    /**
     * Check if user has all of the specified permissions
     * @param {String} userId - User ID
     * @param {Array} permissions - Array of permission names
     * @returns {Boolean} - Has all permissions
     */
    static async hasAllPermissions(userId, permissions) {
        const staff = await Staff.findById(userId).populate({
            path: 'role',
            populate: {
                path: 'permissions',
                model: 'Permission'
            }
        });

        if (!staff || !staff.role) {
            return false;
        }

        const userPermissions = staff.role.permissions.map(p => p.name);
        return permissions.every(permission => userPermissions.includes(permission));
    }

    /**
     * Get user permissions
     * @param {String} userId - User ID
     * @returns {Array} - Array of permission names
     */
    static async getUserPermissions(userId) {
        const staff = await Staff.findById(userId).populate({
            path: 'role',
            populate: {
                path: 'permissions',
                model: 'Permission'
            }
        });

        if (!staff || !staff.role) {
            return [];
        }

        return staff.role.permissions.map(p => p.name);
    }

    /**
     * Bulk Operations
     */

    /**
     * Create default permissions for the system
     * @returns {Array} - Created permissions
     */
    static async createDefaultPermissions() {
        const defaultPermissions = [
            // Staff Management
            { name: 'create:staff', description: 'Create new staff members' },
            { name: 'read:staff', description: 'View staff member details' },
            { name: 'update:staff', description: 'Update staff member information' },
            { name: 'delete:staff', description: 'Delete staff members' },
            
            // Role Management
            { name: 'create:roles', description: 'Create new roles' },
            { name: 'read:roles', description: 'View role details' },
            { name: 'update:roles', description: 'Update role information' },
            { name: 'delete:roles', description: 'Delete roles' },
            
            // Permission Management
            { name: 'create:permissions', description: 'Create new permissions' },
            { name: 'read:permissions', description: 'View permission details' },
            { name: 'update:permissions', description: 'Update permission information' },
            { name: 'delete:permissions', description: 'Delete permissions' },
            
            // Tours Management
            { name: 'create:tours', description: 'Create new tours' },
            { name: 'read:tours', description: 'View tour details' },
            { name: 'update:tours', description: 'Update tour information' },
            { name: 'delete:tours', description: 'Delete tours' },
            
            // Bookings Management
            { name: 'create:bookings', description: 'Create new bookings' },
            { name: 'read:bookings', description: 'View booking details' },
            { name: 'update:bookings', description: 'Update booking information' },
            { name: 'delete:bookings', description: 'Delete bookings' },
            
            // Users Management
            { name: 'read:users', description: 'View user details' },
            { name: 'update:users', description: 'Update user information' },
            { name: 'block:users', description: 'Block/unblock users' },
            
            // Reports & Analytics
            { name: 'read:reports', description: 'View reports and analytics' },
            { name: 'export:reports', description: 'Export reports' },
            
            // System Settings
            { name: 'read:settings', description: 'View system settings' },
            { name: 'update:settings', description: 'Update system settings' }
        ];

        const createdPermissions = [];
        
        for (const permissionData of defaultPermissions) {
            try {
                const existingPermission = await Permission.findOne({ name: permissionData.name });
                if (!existingPermission) {
                    const permission = await Permission.create(permissionData);
                    createdPermissions.push(permission);
                }
            } catch (error) {
                console.error(`Error creating permission ${permissionData.name}:`, error);
            }
        }

        return createdPermissions;
    }

    /**
     * Create default roles
     * @returns {Array} - Created roles
     */
    static async createDefaultRoles() {
        // Get all permissions
        const allPermissions = await Permission.find({});
        const permissionMap = {};
        allPermissions.forEach(p => {
            permissionMap[p.name] = p._id;
        });

        const defaultRoles = [
            {
                name: 'Super Admin',
                description: 'Full system access',
                permissions: Object.values(permissionMap) // All permissions
            },
            {
                name: 'Admin',
                description: 'Administrative access',
                permissions: [
                    'read:staff', 'update:staff',
                    'read:roles', 'read:permissions',
                    'create:tours', 'read:tours', 'update:tours',
                    'create:bookings', 'read:bookings', 'update:bookings',
                    'read:users', 'update:users', 'block:users',
                    'read:reports', 'export:reports',
                    'read:settings', 'update:settings'
                ].map(name => permissionMap[name]).filter(Boolean)
            },
            {
                name: 'Manager',
                description: 'Management level access',
                permissions: [
                    'read:staff',
                    'create:tours', 'read:tours', 'update:tours',
                    'read:bookings', 'update:bookings',
                    'read:users', 'update:users',
                    'read:reports'
                ].map(name => permissionMap[name]).filter(Boolean)
            },
            {
                name: 'Customer Support',
                description: 'Customer support access',
                permissions: [
                    'read:tours',
                    'read:bookings', 'update:bookings',
                    'read:users', 'update:users'
                ].map(name => permissionMap[name]).filter(Boolean)
            },
            {
                name: 'Content Manager',
                description: 'Content management access',
                permissions: [
                    'create:tours', 'read:tours', 'update:tours',
                    'read:bookings'
                ].map(name => permissionMap[name]).filter(Boolean)
            }
        ];

        const createdRoles = [];
        
        for (const roleData of defaultRoles) {
            try {
                const existingRole = await Role.findOne({ name: roleData.name });
                if (!existingRole) {
                    const role = await Role.create(roleData);
                    createdRoles.push(role);
                }
            } catch (error) {
                console.error(`Error creating role ${roleData.name}:`, error);
            }
        }

        return createdRoles;
    }
}

module.exports = RBACService;