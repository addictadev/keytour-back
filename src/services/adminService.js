const Admin = require('../model/AdminModel');
const CustomError = require('../utils/customError');
const APIFeatures = require('../utils/apiFeatures');

class AdminService {
    async createAdmin(data) {
        
        const admin = new Admin(data);
        await admin.save();
        return admin;
    }

    async getAdminById(id) {
        const admin = await Admin.findById(id);
        if (!admin) {
            throw new CustomError('Admin not found', 404);
        }
        return admin;
    }

    async getAllAdmins(queryParams) {
        const filter = {};
        const counts = await Admin.find().countDocuments();
        const features = new APIFeatures(Admin.find(filter), queryParams)
            .filter()
            .sort()
            .limitFields()
            .paginate();

        const admins = await features.query;
        return {
            results: admins.length,
            counts: counts,
            data: admins,
        };
    }

    async updateAdmin(id, data) {
        const admin = await Admin.findByIdAndUpdate(id, data, { new: true });
        if (!admin) {
            throw new CustomError('Admin not found', 404);
        }
        return admin;
    }

    async deleteAdmin(id) {
        const admin = await Admin.findByIdAndDelete(id);
        if (!admin) {
            throw new CustomError('Admin not found', 404);
        }
        return admin;
    }
}

module.exports = new AdminService();
