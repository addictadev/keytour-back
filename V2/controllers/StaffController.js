/**
 * Staff Controller V2 - Staff management endpoints
 * 
 * Features:
 * - Complete staff CRUD operations
 * - Advanced filtering and search
 * - Role assignment
 * - Account status management
 * - Bulk operations
 * - Audit trail
 * 
 * @author Expert Backend Developer
 * @version 2.0.0
 */
const Staff = require('../models/StaffModel');

const StaffService = require('../services/StaffService');
const RBACService = require('../services/RBACService');
const CustomError = require('../../src/utils/customError');
const response = require('../../src/utils/response');
const catchAsync = require('../../src/utils/catchAsync');

class StaffController {
    /**
     * Get all staff members with filtering and pagination
     * @route GET /api/v2/staff
     */
    static getAllStaff = catchAsync(async (req, res, next) => {
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            sortBy: req.query.sortBy || 'createdAt',
            sortOrder: req.query.sortOrder || 'desc',
            search: req.query.search || '',
            department: req.query.department || '',
            role: req.query.role || '',
            isActive: req.query.isActive || '',
            isBlocked: req.query.isBlocked || ''
        };

        const result = await StaffService.getStaffMembers(options);

        response(res, 200, result, 'Staff members retrieved successfully');
    });

    /**
     * Get staff member by ID
     * @route GET /api/v2/staff/:id
     */
    static getStaffById = catchAsync(async (req, res, next) => {
        const { id } = req.params;

        if (!id) {
            return next(new CustomError('Staff ID is required', 400));
        }

        const staff = await StaffService.getStaffById(id);

        response(res, 200, { staff }, 'Staff member retrieved successfully');
    });

    /**
     * Create new staff member
     * @route POST /api/v2/staff
     */
    static createStaff = catchAsync(async (req, res, next) => {
        const staffData = req.body;

        // Validate required fields
        const requiredFields = ['firstName', 'lastName', 'email', 'password', 'role', 'department', 'employeeId', 'position'];
        for (const field of requiredFields) {
            if (!staffData[field]) {
                return next(new CustomError(`${field} is required`, 400));
            }
        }

        // Validate data format
        const validation = StaffService.validateStaffData(staffData);
        if (!validation.isValid) {
            return next(new CustomError(`Validation failed: ${validation.errors.join(', ')}`, 400));
        }

        const createdBy = req.user._id;
        const staff = await StaffService.createStaff(staffData, createdBy);

        response(res, 201, { staff }, 'Staff member created successfully');
    });

    /**
     * Update staff member
     * @route PUT /api/v2/staff/:id
     */
    static updateStaff = catchAsync(async (req, res, next) => {
        const { id } = req.params;
        const updateData = req.body;

        if (!id) {
            return next(new CustomError('Staff ID is required', 400));
        }

        if (Object.keys(updateData).length === 0) {
            return next(new CustomError('No update data provided', 400));
        }

        // Validate update data if provided
        if (Object.keys(updateData).length > 0) {
            const validation = StaffService.validateStaffData(updateData);
            if (!validation.isValid) {
                return next(new CustomError(`Validation failed: ${validation.errors.join(', ')}`, 400));
            }
        }

        const updatedBy = req.user._id;
        const staff = await StaffService.updateStaff(id, updateData, updatedBy);

        response(res, 200, { staff }, 'Staff member updated successfully');
    });

    /**
     * Delete staff member (soft delete)
     * @route DELETE /api/v2/staff/:id
     */
    static deleteStaff = catchAsync(async (req, res, next) => {
        const { id } = req.params;

        if (!id) {
            return next(new CustomError('Staff ID is required', 400));
        }

        const deletedBy = req.user._id;
      const result  = await StaffService.deleteStaff(id, deletedBy);
      console.log(result);

        response(res, 200, null, 'Staff member deleted successfully');
    });

    /**
     * Block/Unblock staff member
     * @route PATCH /api/v2/staff/:id/block
     */
    static toggleBlockStatus = catchAsync(async (req, res, next) => {
        const { id } = req.params;
        const { isBlocked } = req.body;

        if (!id) {
            return next(new CustomError('Staff ID is required', 400));
        }

        if (typeof isBlocked !== 'boolean') {
            return next(new CustomError('isBlocked must be a boolean value', 400));
        }

        const blockedBy = req.user._id;
        const staff = await StaffService.toggleBlockStatus(id, isBlocked, blockedBy);

        const action = isBlocked ? 'blocked' : 'unblocked';
        response(res, 200, { staff }, `Staff member ${action} successfully`);
    });

    /**
     * Reset staff password
     * @route POST /api/v2/staff/:id/reset-password
     */
    static resetPassword = catchAsync(async (req, res, next) => {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!id) {
            return next(new CustomError('Staff ID is required', 400));
        }

        if (!newPassword) {
            return next(new CustomError('New password is required', 400));
        }

        const resetBy = req.user._id;
        await StaffService.resetPassword(id, newPassword, resetBy);

        response(res, 200, null, 'Password reset successfully');
    });

    /**
     * Assign role to staff member
     * @route POST /api/v2/staff/:id/assign-role
     */
    static assignRole = catchAsync(async (req, res, next) => {
        const { id } = req.params;
        const { roleId } = req.body;

        if (!id) {
            return next(new CustomError('Staff ID is required', 400));
        }

        if (!roleId) {
            return next(new CustomError('Role ID is required', 400));
        }

        const assignedBy = req.user._id;
        const staff = await RBACService.assignRoleToStaff(id, roleId, assignedBy);

        response(res, 200, { staff }, 'Role assigned successfully');
    });

    /**
     * Remove role from staff member
     * @route DELETE /api/v2/staff/:id/remove-role
     */
    static removeRole = catchAsync(async (req, res, next) => {
        const { id } = req.params;

        if (!id) {
            return next(new CustomError('Staff ID is required', 400));
        }

        // Check if staff exists
        const staff = await Staff.findById(id);
        if (!staff) {
            return next(new CustomError('Staff member not found', 404));
        }

        // Prevent removing role from Super Admin
        if (staff.email === 'superadmin@keytour.com') {
            return next(new CustomError('Cannot remove role from Super Admin', 400));
        }
if(!staff.role){
    return next(new CustomError('this staff member has no role', 400));
}
        // Remove the role (set to null)
        staff.role = null;
        staff.updatedBy = req.user._id;
        await staff.save({validateBeforeSave: false});

        response(res, 200, staff , 'Role removed successfully');
    });

    /**
     * Get staff member's active sessions
     * @route GET /api/v2/staff/:id/sessions
     */
    static getStaffSessions = catchAsync(async (req, res, next) => {
        const { id } = req.params;

        if (!id) {
            return next(new CustomError('Staff ID is required', 400));
        }

        const sessions = await StaffService.getActiveSessions(id);

        response(res, 200, { sessions }, 'Staff sessions retrieved successfully');
    });

    /**
     * Revoke staff member's session
     * @route DELETE /api/v2/staff/:id/sessions/:sessionId
     */
    static revokeStaffSession = catchAsync(async (req, res, next) => {
        const { id, sessionId } = req.params;

        if (!id || !sessionId) {
            return next(new CustomError('Staff ID and Session ID are required', 400));
        }

        const revokedBy = req.user._id;
        await StaffService.revokeSession(id, sessionId, revokedBy);

        response(res, 200, null, 'Session revoked successfully');
    });

    /**
     * Search staff members
     * @route GET /api/v2/staff/search
     */
    static searchStaff = catchAsync(async (req, res, next) => {
        const { q: searchTerm } = req.query;

        if (!searchTerm) {
            return next(new CustomError('Search term is required', 400));
        }

        const filters = {
            department: req.query.department,
            isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined
        };

        const staff = await StaffService.searchStaff(searchTerm, filters);

        response(res, 200, { staff }, 'Search completed successfully');
    });

    /**
     * Get staff statistics
     * @route GET /api/v2/staff/statistics
     */
    static getStatistics = catchAsync(async (req, res, next) => {
        const statistics = await StaffService.getStaffStatistics();

        response(res, 200, { statistics }, 'Statistics retrieved successfully');
    });

    /**
     * Bulk operations on staff members
     * @route POST /api/v2/staff/bulk
     */
    static bulkOperations = catchAsync(async (req, res, next) => {
        const { operation, staffIds, data } = req.body;

        if (!operation || !Array.isArray(staffIds) || staffIds.length === 0) {
            return next(new CustomError('Operation and staff IDs array are required', 400));
        }

        const allowedOperations = ['block', 'unblock', 'activate', 'deactivate', 'assign-role'];
        if (!allowedOperations.includes(operation)) {
            return next(new CustomError(`Invalid operation. Allowed: ${allowedOperations.join(', ')}`, 400));
        }

        const operatedBy = req.user._id;
        const results = [];

        for (const staffId of staffIds) {
            try {
                let result;
                switch (operation) {
                    case 'block':
                        result = await StaffService.toggleBlockStatus(staffId, true, operatedBy);
                        break;
                    case 'unblock':
                        result = await StaffService.toggleBlockStatus(staffId, false, operatedBy);
                        break;
                    case 'activate':
                        result = await StaffService.updateStaff(staffId, { isActive: true }, operatedBy);
                        break;
                    case 'deactivate':
                        result = await StaffService.updateStaff(staffId, { isActive: false }, operatedBy);
                        break;
                    case 'assign-role':
                        if (!data?.roleId) {
                            throw new Error('Role ID is required for assign-role operation');
                        }
                        result = await RBACService.assignRoleToStaff(staffId, data.roleId, operatedBy);
                        break;
                }
                results.push({ staffId, success: true, data: result });
            } catch (error) {
                results.push({ staffId, success: false, error: error.message });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        response(res, 200, {
            results,
            summary: {
                total: staffIds.length,
                successful: successCount,
                failed: failureCount
            }
        }, `Bulk operation completed. ${successCount} successful, ${failureCount} failed`);
    });

    /**
     * Export staff data
     * @route GET /api/v2/staff/export
     */
    static exportStaff = catchAsync(async (req, res, next) => {
        const { format = 'json' } = req.query;

        if (!['json', 'csv'].includes(format)) {
            return next(new CustomError('Invalid export format. Supported: json, csv', 400));
        }

        // Get all staff data
        const result = await StaffService.getStaffMembers({
            page: 1,
            limit: 10000, // Large limit to get all
            sortBy: 'createdAt',
            sortOrder: 'desc'
        });

        if (format === 'json') {
            response(res, 200, {
                staff: result.staff,
                exportedAt: new Date().toISOString(),
                totalCount: result.pagination.total
            }, 'Staff data exported successfully');
        } else if (format === 'csv') {
            // Convert to CSV format
            const csvHeader = 'ID,First Name,Last Name,Email,Department,Position,Role,Active,Blocked,Created At\n';
            const csvData = result.staff.map(staff => {
                return [
                    staff._id,
                    staff.firstName,
                    staff.lastName,
                    staff.email,
                    staff.department,
                    staff.position,
                    staff.role?.name || 'N/A',
                    staff.isActive,
                    staff.isBlocked,
                    new Date(staff.createdAt).toISOString()
                ].join(',');
            }).join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=staff_export.csv');
            res.send(csvHeader + csvData);
        }
    });

    /**
     * Get staff member's permissions
     * @route GET /api/v2/staff/:id/permissions
     */
    static getStaffPermissions = catchAsync(async (req, res, next) => {
        const { id } = req.params;

        if (!id) {
            return next(new CustomError('Staff ID is required', 400));
        }

        const permissions = await RBACService.getUserPermissions(id);

        response(res, 200, { permissions }, 'Staff permissions retrieved successfully');
    });

    /**
     * Check if staff member has specific permission
     * @route POST /api/v2/staff/:id/check-permission
     */
    static checkStaffPermission = catchAsync(async (req, res, next) => {
        const { id } = req.params;
        const { permission } = req.body;

        if (!id) {
            return next(new CustomError('Staff ID is required', 400));
        }

        if (!permission) {
            return next(new CustomError('Permission is required', 400));
        }

        const hasPermission = await RBACService.hasPermission(id, permission);

        response(res, 200, {
            staffId: id,
            permission,
            hasPermission
        }, 'Permission check completed');
    });
}

module.exports = StaffController;