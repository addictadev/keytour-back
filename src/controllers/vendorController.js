const VendorService = require('../services/vendorService');
const response = require('../utils/response');
const catchAsync = require('../utils/catchAsync');


class VendorController {
    async createVendor(req, res, next) {
        try {
            // Extract file paths from the request
            const image = req.files['image'] ? req.files['image'][0].path.replace(/\\/g, '/') : null;
            const imagesthubnails = req.files['imagesthubnails'] ? req.files['imagesthubnails'].map(file => file.path.replace(/\\/g, '/')) : [];

            // Include the image and imagesthubnails in the vendor data
            const vendorData = {
                ...req.body,
                image: image,
                imagesthubnails: imagesthubnails
            };

            const vendor = await VendorService.createVendor(vendorData);
            response(res, 201, vendor, 'Vendor created successfully');
        } catch (err) {
            next(err);
        }
    }

    async getVendorById(req, res, next) {
        try {
            let roling = false
            if (req.headers.role == 'admin') {
                roling=true
                console.log(roling)
            }
            const vendor = await VendorService.getVendorById(req.params.id,roling);
            response(res, 200, vendor, 'Vendor retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

 
    
    async updateVendorStatus(req, res, next) {
        try {
            const { vendorId } = req.params;
            const { status } = req.body;

            const updatedVendor = await VendorService.updateVendorStatus(vendorId, status);
            response(res, 200, updatedVendor, `Vendor ${status} successfully`);
        } catch (err) {
            next(err);
        }
    }

    getAllVendors = catchAsync(async (req, res, next) => {
        const result = await VendorService.getAllVendors(req.query);

        response(res, 200, result.data, 'Tours retrieved successfully', {
            results: result.results,
            counts: result.counts,
            pendingCount: result.pendingCount,
            acceptedCount: result.acceptedCount,
            rejectedCount: result.rejectedCount,
        });
    });

    // async getAllVendors(req, res, next) {
    //     try {
    //         const vendors = await VendorService.getAllVendors();
    //         response(res, 200, vendors, 'Vendors retrieved successfully');
    //     } catch (err) {
    //         next(err);
    //     }
    // }

    async updateVendor(req, res, next) {
        try {
            const vendor = await VendorService.updateVendor(req.params.id, req.body);
            response(res, 200, vendor, 'Vendor updated successfully');
        } catch (err) {
            next(err);
        }
    }

    async deleteVendor(req, res, next) {
        try {
            await VendorService.deleteVendor(req.params.id);
            response(res, 200, null, 'Vendor deleted successfully');
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new VendorController();
