/**
 * Staff Service - Staff management operations
 * 
 * Implements SOLID principles:
 * - S: Single Responsibility - Handles only staff management
 * - O: Open/Closed - Extensible for new staff operations
 * - L: Liskov Substitution - Consistent interface
 * - I: Interface Segregation - Focused methods
 * - D: Dependency Inversion - Depends on abstractions
 * 
 * @author Expert Backend Developer
 * @version 2.0.0
 */

const Staff = require('../models/StaffModel');
const Role = require('../../src/model/RoleModel');
const RefreshToken = require('../models/RefreshTokenModel');
const TokenBlacklist = require('../models/TokenBlacklistModel');
const CustomError = require('../../src/utils/customError');
const bcrypt = require('bcryptjs');

class StaffService {
    /**
     * Create new staff member
     * @param {Object} staffData - Staff data
     * @param {String} createdBy - ID of user creating the staff
     * @returns {Object} - Created staff member
     */
    static async createStaff(staffData, createdBy) {
        const {
            firstName,
            lastName,
            email,
            password,
            phone,
            role,
            department,
            employeeId,
            position
        } = staffData;

        // Validate required fields
        if (!firstName || !lastName || !email || !password || !role || !department || !employeeId || !position) {
            throw new CustomError('All required fields must be provided', 400);
        }

        // Check if email already exists
        const existingEmail = await Staff.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            throw new CustomError('Email already exists', 409);
        }

        // Check if employee ID already exists
        const existingEmployeeId = await Staff.findOne({ employeeId });
        if (existingEmployeeId) {
            throw new CustomError('Employee ID already exists', 409);
        }

        // Validate role exists
        const roleDoc = await Role.findById(role);
        if (!roleDoc) {
            throw new CustomError('Invalid role specified', 400);
        }

        // Validate password strength
        if (password.length < 8) {
            throw new CustomError('Password must be at least 8 characters long', 400);
        }

        // Create staff member
        const staff = await Staff.create({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password,
            phone,
            role,
            department,
            employeeId,
            position,
            createdBy,
            isEmailVerified: false // Will need email verification
        });

        // Populate role and return sanitized data
        await staff.populate({
            path: 'role',
            populate: {
                path: 'permissions',
                model: 'Permission'
            }
        });

        return this.sanitizeStaffData(staff);
    }

    /**
     * Get staff members with advanced filtering and pagination
     * @param {Object} options - Query options
     * @returns {Object} - Staff members with pagination
     */
    static async getStaffMembers(options = {}) {
        const {
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            search = '',
            department = '',
            role = '',
            isActive = '',
            isBlocked = ''
        } = options;

        // Build query
        const query = {};

        // Search in name and email
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by department
        if (department) {
            query.department = department;
        }

        // Filter by role
        if (role) {
            query.role = role;
        }

        // Filter by active status
        if (isActive !== '') {
            query.isActive = isActive === 'true';
        }

        // Filter by blocked status
        if (isBlocked !== '') {
            query.isBlocked = isBlocked === 'true';
        }

        // Build sort object
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        // Execute query with pagination
        const staff = await Staff.find(query)
            .populate({
                path: 'role',
                populate: {
                    path: 'permissions',
                    model: 'Permission'
                }
            })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Staff.countDocuments(query);

        return {
            staff: staff.map(s => this.sanitizeStaffData(s)),
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get staff member by ID
     * @param {String} staffId - Staff ID
     * @returns {Object} - Staff member data
     */
    static async getStaffById(staffId) {
        const staff = await Staff.findById(staffId)
            .populate({
                path: 'role',
                populate: {
                    path: 'permissions',
                    model: 'Permission'
                }
            })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        if (!staff) {
            throw new CustomError('Staff member not found', 404);
        }

        return this.sanitizeStaffData(staff);
    }

    /**
     * Update staff member
     * @param {String} staffId - Staff ID
     * @param {Object} updateData - Update data
     * @param {String} updatedBy - ID of user making the update
     * @returns {Object} - Updated staff member
     */
    static async updateStaff(staffId, updateData, updatedBy) {
        const staff = await Staff.findById(staffId);
        
        if (!staff) {
            throw new CustomError('Staff member not found', 404);
        }

        // Fields that can be updated
        const allowedFields = [
            'firstName', 'lastName', 'phone', 'department', 
            'position', 'isActive', 'isBlocked', 'timezone', 
            'language', 'avatar'
        ];

        // Build update object with only allowed fields
        const updateObj = {};
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                updateObj[field] = updateData[field];
            }
        }

        // Handle email update separately (needs uniqueness check)
        if (updateData.email && updateData.email !== staff.email) {
            const existingEmail = await Staff.findOne({ 
                email: updateData.email.toLowerCase(),
                _id: { $ne: staffId } 
            });
            
            if (existingEmail) {
                throw new CustomError('Email already exists', 409);
            }
            
            updateObj.email = updateData.email.toLowerCase();
            updateObj.isEmailVerified = false; // Require re-verification
        }

        // Handle employee ID update
        if (updateData.employeeId && updateData.employeeId !== staff.employeeId) {
            const existingEmployeeId = await Staff.findOne({
                employeeId: updateData.employeeId,
                _id: { $ne: staffId }
            });
            
            if (existingEmployeeId) {
                throw new CustomError('Employee ID already exists', 409);
            }
            
            updateObj.employeeId = updateData.employeeId;
        }

        // Handle role update
        if (updateData.role && updateData.role !== staff.role.toString()) {
            const roleDoc = await Role.findById(updateData.role);
            if (!roleDoc) {
                throw new CustomError('Invalid role specified', 400);
            }
            updateObj.role = updateData.role;

            // If role is changed, invalidate all tokens for security
            await RefreshToken.revokeAllForUser(staffId, 'staff', 'role_change');
            await TokenBlacklist.blacklistAllForUser(staffId, 'staff', 'role_change');
        }

        // Set updatedBy
        updateObj.updatedBy = updatedBy;

        const updatedStaff = await Staff.findByIdAndUpdate(
            staffId,
            updateObj,
            { new: true, runValidators: true }
        ).populate({
            path: 'role',
            populate: {
                path: 'permissions',
                model: 'Permission'
            }
        });

        return this.sanitizeStaffData(updatedStaff);
    }

    /**
     * Delete staff member (soft delete by deactivating)
     * @param {String} staffId - Staff ID
     * @param {String} deletedBy - ID of user performing deletion
     * @returns {Boolean} - Success status
     */
    static async deleteStaff(staffId, deletedBy) {
        const staff = await Staff.findById(staffId);
        console.log("staff", staff);
        if (staff.isBlocked&&!staff.isActive) {
            throw new CustomError('Staff member already deactivated', 404);
        }

        // Prevent self-deletion
        if (staffId === deletedBy) {
            throw new CustomError('You cannot delete your own account', 400);
        }
console.log(staffId, deletedBy);
        // Soft delete by deactivating
        await Staff.findByIdAndUpdate(staffId, {
            isActive: false,
            isBlocked: true,
            updatedBy: deletedBy
        });
        console.log("staffId", deletedBy);

        // Revoke all tokens
        await RefreshToken.revokeAllForUser(staffId, 'staff', 'admin_action');
        await TokenBlacklist.blacklistAllForUser(staffId, 'staff', 'account_suspended');

        return true;
    }

    /**
     * Block/Unblock staff member
     * @param {String} staffId - Staff ID
     * @param {Boolean} isBlocked - Block status
     * @param {String} blockedBy - ID of user performing the action
     * @returns {Object} - Updated staff member
     */
    static async toggleBlockStatus(staffId, isBlocked, blockedBy) {
        const staff = await Staff.findById(staffId);
        
        if (!staff) {
            throw new CustomError('Staff member not found', 404);
        }

        // Prevent self-blocking
        if (staffId === blockedBy) {
            throw new CustomError('You cannot block your own account', 400);
        }

        const updatedStaff = await Staff.findByIdAndUpdate(
            staffId,
            { 
                isBlocked,
                updatedBy: blockedBy
            },
            { new: true, runValidators: true }
        ).populate({
            path: 'role',
            populate: {
                path: 'permissions',
                model: 'Permission'
            }
        });

        // If blocking, revoke all tokens
        if (isBlocked) {
            await RefreshToken.revokeAllForUser(staffId, 'staff', 'account_blocked');
            await TokenBlacklist.blacklistAllForUser(staffId, 'staff', 'account_blocked');
        }

        return this.sanitizeStaffData(updatedStaff);
    }

    /**
     * Reset staff password
     * @param {String} staffId - Staff ID
     * @param {String} newPassword - New password
     * @param {String} resetBy - ID of user performing reset
     * @returns {Boolean} - Success status
     */
    static async resetPassword(staffId, newPassword, resetBy) {
        const staff = await Staff.findById(staffId);
        
        if (!staff) {
            throw new CustomError('Staff member not found', 404);
        }

        // Validate password strength
        if (newPassword.length < 8) {
            throw new CustomError('Password must be at least 8 characters long', 400);
        }

        // Update password
        staff.password = newPassword;
        staff.lastPasswordChange = new Date();
        staff.updatedBy = resetBy;
        await staff.save();

        // Revoke all tokens for security
        await RefreshToken.revokeAllForUser(staffId, 'staff', 'password_reset');
        await TokenBlacklist.blacklistAllForUser(staffId, 'staff', 'password_reset');

        return true;
    }

    /**
     * Get staff member's active sessions
     * @param {String} staffId - Staff ID
     * @returns {Array} - Active refresh tokens
     */
    static async getActiveSessions(staffId) {
        const activeSessions = await RefreshToken.find({
            userId: staffId,
            userType: 'staff',
            isRevoked: false,
            expiresAt: { $gt: new Date() }
        }).select('-token -hashedToken').sort({ lastUsed: -1 });

        return activeSessions;
    }

    /**
     * Revoke specific session
     * @param {String} staffId - Staff ID
     * @param {String} sessionId - Session ID (refresh token ID)
     * @param {String} revokedBy - ID of user revoking the session
     * @returns {Boolean} - Success status
     */
    static async revokeSession(staffId, sessionId, revokedBy) {
        const session = await RefreshToken.findOne({
            _id: sessionId,
            userId: staffId,
            userType: 'staff',
            isRevoked: false
        });

        if (!session) {
            throw new CustomError('Session not found', 404);
        }

        await session.revoke('admin_action', revokedBy);
        return true;
    }

    /**
     * Get staff statistics
     * @returns {Object} - Staff statistics
     */
    static async getStaffStatistics() {
        const stats = await Staff.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
                    blocked: { $sum: { $cond: [{ $eq: ['$isBlocked', true] }, 1, 0] } },
                    verified: { $sum: { $cond: [{ $eq: ['$isEmailVerified', true] }, 1, 0] } }
                }
            }
        ]);

        const departmentStats = await Staff.aggregate([
            {
                $group: {
                    _id: '$department',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const roleStats = await Staff.aggregate([
            {
                $lookup: {
                    from: 'roles',
                    localField: 'role',
                    foreignField: '_id',
                    as: 'roleInfo'
                }
            },
            {
                $unwind: '$roleInfo'
            },
            {
                $group: {
                    _id: '$roleInfo.name',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        return {
            overview: stats[0] || { total: 0, active: 0, blocked: 0, verified: 0 },
            byDepartment: departmentStats,
            byRole: roleStats
        };
    }

    /**
     * Search staff members
     * @param {String} searchTerm - Search term
     * @param {Object} filters - Additional filters
     * @returns {Array} - Matching staff members
     */
    static async searchStaff(searchTerm, filters = {}) {
        const query = {
            $or: [
                { firstName: { $regex: searchTerm, $options: 'i' } },
                { lastName: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } },
                { employeeId: { $regex: searchTerm, $options: 'i' } },
                { position: { $regex: searchTerm, $options: 'i' } }
            ]
        };

        // Apply additional filters
        if (filters.department) {
            query.department = filters.department;
        }
        if (filters.isActive !== undefined) {
            query.isActive = filters.isActive;
        }

        const staff = await Staff.find(query)
            .populate('role', 'name')
            .limit(20)
            .sort({ firstName: 1 });

        return staff.map(s => this.sanitizeStaffData(s));
    }

    /**
     * Sanitize staff data for response (remove sensitive fields)
     * @param {Object} staff - Staff object
     * @returns {Object} - Sanitized staff data
     */
    static sanitizeStaffData(staff) {
        const staffObj = staff.toObject ? staff.toObject() : staff;
        
        // Remove sensitive fields
        delete staffObj.password;
        delete staffObj.twoFactorSecret;
        delete staffObj.failedLoginAttempts;
        delete staffObj.lockUntil;
        delete staffObj.__v;
        
        return staffObj;
    }

    /**
     * Validate staff data
     * @param {Object} staffData - Staff data to validate
     * @returns {Object} - Validation result
     */
    static validateStaffData(staffData) {
        const errors = [];

        // Validate email format
        if (staffData.email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(staffData.email)) {
            errors.push('Invalid email format');
        }

        // Validate phone format
        if (staffData.phone && !/^\+?[\d\s-()]+$/.test(staffData.phone)) {
            errors.push('Invalid phone number format');
        }

        // Validate department
        const validDepartments = ['IT', 'Marketing', 'Sales', 'Customer Support', 'Content', 'Finance', 'HR', 'Operations'];
        if (staffData.department && !validDepartments.includes(staffData.department)) {
            errors.push('Invalid department');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = StaffService;