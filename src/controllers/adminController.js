const AdminService = require('../services/adminService');
const response = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

class AdminController {
    async createAdmin(req, res, next) {
        try {
            const admin = await AdminService.createAdmin(req.body);
            response(res, 201, admin, 'Admin created successfully');
        } catch (err) {
            next(err);
        }
    }

    async getAdminById(req, res, next) {
        try {
            const admin = await AdminService.getAdminById(req.params.id);
            response(res, 200, admin, 'Admin retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    getAllAdmins = catchAsync(async (req, res, next) => {
        const result = await AdminService.getAllAdmins(req.query);
        response(res, 200, result.data, 'Admins retrieved successfully', {
            results: result.results,
            counts: result.counts,
        });
    });

    async updateAdmin(req, res, next) {
        try {
            const admin = await AdminService.updateAdmin(req.params.id, req.body);
            response(res, 200, admin, 'Admin updated successfully');
        } catch (err) {
            next(err);
        }
    }

    async deleteAdmin(req, res, next) {
        try {
            await AdminService.deleteAdmin(req.params.id);
            response(res, 200, null, 'Admin deleted successfully');
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new AdminController();
