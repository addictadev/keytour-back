const Vendor = require('../model/VendorModel');
const Booking = require('../model/BookingModel');
const Tour = require('../model/ToursModel');
const Review = require('../model/ReviewModel');
const EmailService = require('../utils/emailService');

const Admin = require('../model/AdminModel');

const CustomError = require('../utils/customError');
const APIFeatures = require('../utils/apiFeatures');
const bcrypt = require('bcryptjs');

const jwt = require('../utils/jwt');

class VendorService {
    async createVendor(data) {
        const vendor = new Vendor(data);
        await vendor.save();
        return vendor;
    }

    // async getVendorById(id) {
    //     const vendor = await Vendor.findById(id);
    //     if (!vendor) {
    //         throw new CustomError('Vendor not found', 404);
    //     }
    //     return vendor;
    // }

    async getVendorById(id, roling) {
        const vendor = await Vendor.findById(id);
        if (!vendor) {
            throw new CustomError('Vendor not found', 404);
        }
    
        // Check if the request is from an admin
        if (!roling) {
        return vendor;
           
        }
    
        // Count tours by status
        const tourCounts = await Tour.aggregate([
            { $match: { vendor: vendor._id } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
    
        // Initialize counts for all tour statuses
        const tourStatusCount = {
            pending: 0,
            accepted: 0,
            rejected: 0
        };
    
        // Update tour status counts
        tourCounts.forEach(count => {
            tourStatusCount[count._id] = count.count;
        });
    
        // Count bookings by status and calculate total revenue for confirmed bookings
        const bookingCountsAndRevenue = await Booking.aggregate([
            { $match: { vendor: vendor._id } },
            { $group: {
                _id: "$status", 
                count: { $sum: 1 },
                totalRevenue: { $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, "$totalPrice", 0] } }
            }}
        ]);
    
        // Initialize counts and revenue for all booking statuses
        const bookingStatusCount = {
            pending: 0,
            confirmed: 0,
            cancelled: 0,
            canceledbyvendor: 0,
            fullcapacity: 0
        };
        let totalConfirmedRevenue = 0;
    
        // Update booking status counts and revenue
        bookingCountsAndRevenue.forEach(count => {
            bookingStatusCount[count._id] = count.count;
            if (count._id === "confirmed") {
                totalConfirmedRevenue =parseInt(count.totalRevenue);
            }
        });
    
        // Calculate average rating and review count for vendor's tours
        const reviews = await Review.aggregate([
            { $match: { vendor: vendor._id } },
            { $group: { _id: null, averageRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } }
        ]);
    
        const averageRating = reviews.length > 0 ? reviews[0].averageRating : 0;
        const reviewCount = reviews.length > 0 ? reviews[0].reviewCount : 0;
    
        // Combine vendor data with the calculated statistics
        const vendorData = {
            ...vendor.toObject(),
            tourStatusCount,
            bookingStatusCount,
            averageRating,
            reviewCount,
            totalConfirmedRevenue
        };
    
        return vendorData;
    }


    async updateVendorStatus(vendorId, status) {
        // Validate the status
        if (!['accepted', 'rejected'].includes(status)) {
            throw new CustomError('Invalid status. Only "accepted" or "rejected" are allowed.', 400);
        }

        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            throw new CustomError('Vendor not found', 404);
        }

        // Update the status
        vendor.status = status;
        await vendor.save({validateBeforeSave: false});

        let subject = '';
        let html = '';

        if (status === 'accepted') {
            subject = 'Welcome to KeyTour!';
            html = EmailService.createVendorAcceptedHTML(vendor);
        } else if (status === 'rejected') {
            subject = 'Update on your KeyTour Application';
            html = EmailService.createVendorRejectedHTML(vendor);
        }

        if (subject && html) {
            await EmailService.sendEmail(vendor.email, subject, html);
        }

        return vendor;
    }

    async loginVendor(email, password) {

        // Find vendor by email
        const vendor = await Vendor.findOne({ email });
     if (vendor.isBlocked) throw new CustomError('User is blocked. Please contact support.', 403)

        console.log(vendor.status == 'pending')
        if (!vendor) {
        throw new CustomError('Invalid credentials', 401);
        }
        if (vendor.status == 'pending') {
            throw new CustomError('still pending', 401);
        }
        if (!vendor.status === 'accepted') {
            throw new CustomError('regected', 401);
        }
        // Check if the password matches
        // const isMatch = await bcrypt.compare(password, vendor.password);
        const isMatch = vendor.password==password;

        if (!isMatch) {
            throw new CustomError('Invalid credentials', 401);
        }

        // Generate JWT token
        vendor.password = undefined;
        const token = jwt.createToken(vendor);
        return { user: vendor, token };
    }
    async loginAdmin(email, password) {
        // Find vendor by email
        const vendor = await Admin.findOne({ email });
     
        if (!vendor) {
            throw new CustomError('Invalid credentials', 401);
        }
        // Check if the password matches
        // const isMatch = await bcrypt.compare(password, vendor.password);
        const isMatch = vendor.password==password;

        if (!isMatch) {
            throw new CustomError('Invalid credentials', 401);
        }

        // Generate JWT token
        vendor.password = undefined;
        const token = jwt.createToken(vendor);
        return { user: vendor, token };
    }
    async getAllVendors(queryParams) {
        const filter = {};
        const counts = await Vendor.find().countDocuments();
        const pendingCount = await Vendor.countDocuments({ status: 'pending' });
        const acceptedCount = await Vendor.countDocuments({ status: 'accepted' });
        const rejectedCount = await Vendor.countDocuments({ status: 'rejected' });
        
    
        const features = new APIFeatures(Vendor.find(filter), queryParams)
            .filter()
            .sort()
            .limitFields()
            .paginate();
    
        const tours = await features.query;
        return {
            results: tours.length,
            counts: counts,
            pendingCount: pendingCount,
            acceptedCount: acceptedCount,
            rejectedCount: rejectedCount,
            data: tours
        };
    }
    async updateVendor(id, data) {
        const vendor = await Vendor.findByIdAndUpdate(id, data, { new: true });
        if (!vendor) {
            throw new CustomError('Vendor not found', 404);
        }
        return vendor;
    }
    async deleteVendor(id) {
        try {
            // Delete the vendor by ID
            const vendor = await Vendor.findByIdAndDelete(id);
    
            if (!vendor) {
                throw new CustomError('Vendor not found', 404);
            }
    
            // Delete all tours related to the vendor
            const toursDeleted = await Tour.deleteMany({ vendor: id });
    
            // Delete all bookings related to the vendor
            const bookingsDeleted = await Booking.deleteMany({ vendor: id });
    
            console.log(`Vendor deleted successfully. Deleted ${toursDeleted.deletedCount} tours and ${bookingsDeleted.deletedCount} bookings associated with the vendor.`);
    
            return {
                vendor,
                toursDeletedCount: toursDeleted.deletedCount,
                bookingsDeletedCount: bookingsDeleted.deletedCount,
            };
        } catch (error) {
            console.error('Error while deleting vendor:', error);
            throw new CustomError(`Failed to delete vendor: ${error.message}`, 500);
        }
    }
    
    // async deleteVendor(id) {
    //     const vendor = await Vendor.findByIdAndDelete(id);
    //     const tour = await tours.deleteMany({vendor:id});
    //     const booking = await Booking.deleteMany({vendor:id});


    //     if (!vendor) {
    //         throw new CustomError('Vendor not found', 404);
    //     }
    //     return vendor;
    // }

    
}

module.exports = new VendorService();
