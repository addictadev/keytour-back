
const TourService = require('../services/tourService');
const response = require('../utils/response');
const ImageService = require('../services/imageService');
const catchAsync = require('../utils/catchAsync');
const jwt = require('../utils/jwt');
const mongoose = require('mongoose');

const path = require('path');
const User = require('../model/UserModel');
const Vendor = require('../model/VendorModel');
const Tour = require('../model/ToursModel');
const Booking = require('../model/BookingModel');
const Review = require('../model/ReviewModel');





//     generateValidFilePath =  (filename)=>{
//         const parts = filename.split(/[\\/]/); // Split the filename by both forward slash (/) and backslash (\)
//         const formattedParts = parts.map(part => part.replace(/\\/g, '/')); // Replace backslashes (\) with forward slashes (/)
//         const validPath = formattedParts.join('/'); // Join the parts back together with forward slashes (/)
//         return validPath;
//       }
//     createTour = catchAsync(async (req, res, next) => {
//         // Handle the main image upload
//         if (req.files && req.files.image) {
//             const imagePath =  req.files.image[0].path;
//             req.body.image_url = imagePath;

//             // Generate thumbnail for the main image
//             const thumbnailPath = await ImageService.createThumbnail(imagePath, path.dirname(imagePath));
//             req.body.imagesthubnails = [thumbnailPath];
//         }

//         // Handle multiple image uploads for thumbnails
//         if (req.files && req.files.images) {
//             const imagePaths = req.files.images.map(file => file.path);
//             req.body.imagesthubnails.push(...imagePaths);

//             // Generate thumbnails for all uploaded images
//             for (const imagePath of imagePaths) {
//                 const thumbnailPath = await ImageService.createThumbnail(imagePath, path.dirname(imagePath));
//                 req.body.imagesthubnails.push(thumbnailPath);
//             }
//         }

//         const tour = await TourService.createTour(req.body);
//         response(res, 201, tour, 'Tour created successfully');
//     });
//     getAllTours = catchAsync(async (req, res, next) => {
//         const result = await TourService.getAllTours(req.query);
//         response(res, 200, result.data, 'Tours retrieved successfully', {
//             results: result.results,
//             counts: result.counts,
//         });
//     });


//     async getTourById(req, res, next) {
//         try {
//             const tour = await TourService.getTourById(req.params.id);
//             response(res, 200, tour, 'Tour retrieved successfully');
//         } catch (err) {
//             next(err);
//         }
//     }

//     async updateTour(req, res, next) {
//         try {
//             const tour = await TourService.updateTour(req.params.id, req.body);
//             response(res, 200, tour, 'Tour updated successfully');
//         } catch (err) {
//             next(err);
//         }
//     }

//     async deleteTour(req, res, next) {
//         try {
//             await TourService.deleteTour(req.params.id);
//             response(res, 200, null, 'Tour deleted successfully');
//         } catch (err) {
//             next(err);
//         }
//     }
// }

// module.exports = new TourController();



class TourController {


    fullcapacity = catchAsync(async (req, res, next) => {
        const { tourId } = req.body;
        // const vendorId = req.user._id;
        const {vendorId} = req.body; // Vendor's ID from the logged-in user
         // Vendor's ID from the logged-in user
    
        try {
          // Call the service to handle the cancellation
          const notifications = await TourService.fullcapacity(vendorId, tourId);
    
          // Respond back to the vendor
          res.status(200).json({
            status: 'success',
            message: 'Tour has been fully capacity and notifications have been sent to all affected users',
            notifications: notifications.length,
          });
        } catch (error) {
          return next(error);
        }
      });



       getTourUserBookingInfo = catchAsync(async (req, res, next) => {
        const { tourId } = req.params; // Get tour ID from the request parameters
    
        try {
            // Call the service to get user and booking info for the tour
            const tourUserBookingInfo = await TourService.getUserBookingInfo(tourId);
    
            // Return the data in the response
            res.status(200).json({
                success: true,
                data: tourUserBookingInfo
            });
        } catch (error) {
            next(error);
        }
    });





    cancelTour = catchAsync(async (req, res, next) => {
        const { tourId } = req.body;
        // const vendorId = req.user._id;
        const {vendorId} = req.body; // Vendor's ID from the logged-in user
         // Vendor's ID from the logged-in user
    
        try {
          // Call the service to handle the cancellation
          const notifications = await TourService.cancelTour(vendorId, tourId);
    
          // Respond back to the vendor
          res.status(200).json({
            status: 'success',
            message: 'Tour has been cancelled and notifications have been sent to all affected users',
            notifications: notifications.length,
          });
        } catch (error) {
          return next(error);
        }
      });








    generateValidFilePath = (filename) => {
        return filename.replace(/\\/g, '/'); // Replace all backslashes with forward slashes
    };

    createTour = catchAsync(async (req, res, next) => {
        // Handle the main image upload
        if (req.files && req.files.image) {
            const imagePath = this.generateValidFilePath(req.files.image[0].path);
            req.body.image = imagePath;

            // Generate thumbnail for the main image
            const thumbnailPath = await ImageService.createThumbnail(imagePath, path.dirname(imagePath));
            req.body.imagesthubnails = [this.generateValidFilePath(thumbnailPath)];
        }

        // Handle multiple image uploads for thumbnails
        if (req.files && req.files.images) {
            const imagePaths = req.files.images.map(file => this.generateValidFilePath(file.path));
            req.body.imagesthubnails.push(...imagePaths);

            // Generate thumbnails for all uploaded images
            for (const imagePath of imagePaths) {
                const thumbnailPath = await ImageService.createThumbnail(imagePath, path.dirname(imagePath));
                req.body.imagesthubnails.push(this.generateValidFilePath(thumbnailPath));
            }
        }
console.log(req.user)
        
        if (req.user.defaultrole=="vendor") {
   
            req.body.vendor=req.user._id
       
         
            }        
        const tour = await TourService.createTour(req.body);
   

        response(res, 201, tour, 'Tour created successfully');
    });
    updateTourStatus = catchAsync(async (req, res, next) => {
        const { tourId, status } = req.body;
        const updatedTour = await TourService.updateTourStatus(tourId, status);
        response(res, 200, updatedTour, `Tour status updated to ${status}`);
    });

    














    getAllTours = catchAsync(async (req, res, next) => { 
        let s =false;
        if (req.query?.fields?.trim() === 'destination'){
          s=true
        }
        // Step 1: If role is not admin, set status=accepted
        let fil;
        if (!req.headers.role) {
            req.query.status = 'accepted';
            req.query.cancelByVendor = false;
            req.query.capacity = 'pending';

            fil=true
        }
        if (req.headers.role || req.headers.role == 'vendor') {
            console.log("object",req.headers.role )
            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
                const token = req.headers.authorization.split(' ')[1];
            
                // Verify the token and get the user
                const decoded = jwt.verifyToken(token);
                console.log(token)
                console.log(decoded)

              const  vendor = await Vendor.findById(decoded.id)
            console.log("object",vendor )

                if (decoded.defaultrole === 'vendor'&&req.query.vendor==decoded.id&&vendor._id==decoded.id) {
            req.query.vendor = vendor._id;
             
                }
                
         
            }
        }
        // Step 2: Check if a token is provided to get the user
        let user;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            const token = req.headers.authorization.split(' ')[1];
        
            // Verify the token and get the user
            const decoded = jwt.verifyToken(token, process.env.JWT_SECRET);
            user = await User.findById(decoded.id).populate('destinationwishlist'); // Populate the destination wishlist
        }
    
        // Step 3: Fetch the tours using TourService
        const result = await TourService.getAllTours(req.query,fil,s);
    
        // Step 4: If the user is logged in, check for tour and destination wishlists
        if (user) {
            const userTourWishlist = user.tourwishlist; // Array of Tour ObjectIds
            const userDestinationWishlist = user.destinationwishlist; // Array of Destination ObjectIds
    
            // Add `wishlist` and `wishlistDestination` keys to the tours
            result.data = result.data.map(tour => {
                // Check if the tour is in the user's tour wishlist
                const isTourWishlisted = userTourWishlist.some(wishTour => wishTour.equals(tour._id)); // Use .equals() to compare ObjectIds
    
                // Check if the destination of the tour is in the user's destination wishlist
                const isDestinationWishlisted = userDestinationWishlist.some(wishDest => wishDest._id.equals(tour.destination._id)); // Assuming `tour.destination._id` exists
    
                return {
                    ...tour.toObject(), // Convert Mongoose object to plain JS object
                    wishlist: isTourWishlisted, // Add wishlist key for tour
                    wishlistDestination: req.query?.fields?.trim() === 'destination' ? isDestinationWishlisted : undefined, // Add wishlistDestination if the field is 'destination'
                };
            });
        }
    
        // Step 5: Return the response
        response(res, 200, result.data, 'Tours retrieved successfully', {
            results: result.results,
            counts: result.counts,
            pendingCount: result.pendingCount,
            acceptedCount: result.acceptedCount,
            rejectedCount: result.rejectedCount,
            cancelledCount: result.cancelledCount,
            
        });
    });

    

   
    
    async resendTourRequest(req, res, next) {
        try {
          const { tourId } = req.params;
    
          // Find the tour by ID
          const tour = await Tour.findById(tourId);
    
          if (!tour) {
            return next(new CustomError('Tour not found', 404));
          }
    
          // Update the status to 'pending', reset resend to false, and increment numberofresend
          tour.status = 'pending';
          tour.resend = false;
          tour.numberofresend += 1;
    
          // Save the tour without running validation
          await tour.save({ validateBeforeSave: false });
    
          // Send success response
          res.status(200).json({
            status: 'success',
            message: 'Tour request has been resent and status set to pending',
            data: tour,
          });
        } catch (err) {
          next(err);
        }
      }


      async getTourById(req, res, next) {
        try {
            const tourId = req.params.id;
            const isAdmin = req.headers.role === 'admin'; // Check if the user is an admin
            let bookingsDataa = null;
            let reviewsDataa = null;
            let vendorTotalRevenuee = null;
    
            // Fetch the tour data
            const tour = await TourService.getTourById(tourId);
    
            // Check if the tour object is valid
            if (!tour) {
                return response(res, 404, null, 'Tour not found');
            }
    
            // If the user is an admin, fetch and aggregate additional data
            if (isAdmin) {

                // Aggregate bookings data
                const bookingsAggregation = await Booking.aggregate([
                    { $match: { tour: new mongoose.Types.ObjectId(tourId)  } },
                    {
                        $group: {
                            _id: null,
                            totalBookings: { $sum: 1 },
                            confirmedBookings: { $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] } },
                            canceledBookings: { $sum: { $cond: [{ $eq: ["$status", "canceled"] }, 1, 0] } },
                            totalRevenue: { 
                                $sum: {
                                    $cond: [
                                        { $eq: ["$status", "confirmed"] }, // Only sum totalPrice if the status is "confirmed"
                                        "$totalPrice",  // The value to sum (totalPrice) if the condition is met
                                        0  // If the condition is not met, add 0 (do not include this booking's totalPrice)
                                    ]
                                }
                            }
                        }
                    }
                ]);
                
                const bookingsData = bookingsAggregation[0] || {
                    totalBookings: 0,
                    confirmedBookings: 0,
                    canceledBookings: 0,
                    totalRevenue: 0
                };
                
                // Calculate admin and vendor revenue
                const adminRevenue = bookingsData.totalRevenue * 0.15;
                const vendorRevenue = bookingsData.totalRevenue - adminRevenue;
                
                // Calculate the number of pending bookings
                const pendingBookings = bookingsData.totalBookings - bookingsData.confirmedBookings - bookingsData.canceledBookings;
                
                // Calculate percentages
                const confirmedPercentage = (bookingsData.confirmedBookings / bookingsData.totalBookings) * 100;
                const canceledPercentage = (bookingsData.canceledBookings / bookingsData.totalBookings) * 100;
                const pendingPercentage = (pendingBookings / bookingsData.totalBookings) * 100;
                
                // Construct the result object
                const result = {
                    totalBookings: bookingsData.totalBookings,
                    confirmedBookings: bookingsData.confirmedBookings,
                    canceledBookings: bookingsData.canceledBookings,
                    pendingBookings: pendingBookings,
                    totalRevenue: bookingsData.totalRevenue,
                    adminRevenue: adminRevenue,
                    vendorRevenue: vendorRevenue,
                    confirmedPercentage: confirmedPercentage.toFixed(2),
                    canceledPercentage: canceledPercentage.toFixed(2),
                    pendingPercentage: pendingPercentage.toFixed(2)
                };
                
                const reviewsAggregation = await Review.aggregate([
                    { $match: { tour: new mongoose.Types.ObjectId(tourId) } }, // Filter reviews by tour ID
                    {
                        $group: {
                            _id: null,
                            totalReviews: { $sum: 1 },
                            averageRating: { $avg: "$rating" }
                        }
                    }
                ]);
    
                // Check if aggregations return valid data, otherwise set defaults
                const reviewsData = reviewsAggregation[0] || {
                    totalReviews: 0,
                    averageRating: 0
                };
    
                // Log the aggregated data for debugging
                console.log('Bookings Data:', bookingsData);
                console.log('Reviews Data:', reviewsData);
    
                // Store the aggregated data in variables
                bookingsDataa = result;
                reviewsDataa = reviewsData;
    
                // Calculate total revenue for the vendor (totalRevenue * commission)
                const vendor = await Vendor.findById(tour.vendor); // Fetch vendor data
                if (vendor) {
                    const vendorTotalRevenue = bookingsData.totalRevenue * (vendor.commission / 100); // Vendor's total revenue
                    vendorTotalRevenuee = vendorTotalRevenue;
                    console.log('Vendor Total Revenue:', vendorTotalRevenuee);
                } else {
                    console.log('Vendor not found for this tour');
                }
            }
    
            // Use Object.assign to append the data directly into the tour object
console.log(vendorTotalRevenuee)
            // Log the modified tour object for debugging
            const updatedTour = { ...tour.toObject(), vendorTotalRevenuee, bookingsDataa, reviewsDataa };
    
            // Send the response
            response(res, 200, updatedTour, 'Tour retrieved successfully');
        } catch (err) {
            console.error('Error fetching tour data:', err);
            next(err);
        }
    }
    








    //   async getTourById(req, res, next) {
    //     try {
    //         const tourId = req.params.id;
    //         const isAdmin = req.headers.role === 'admin'; // Check if the user is an admin
    
    //         // Fetch the tour data
    //         const tour = await TourService.getTourById(tourId);
    
    //         // If the user is an admin, fetch and aggregate additional data
    //         if (isAdmin) {
    //             console.log(isAdmin)
    //             // Aggregate bookings data
    //             const bookingsAggregation = await Booking.aggregate([
    //                 { $match: { tour: new mongoose.Types.ObjectId(tourId) } }, // Filter bookings by tour ID
    //                 {
    //                     $group: {
    //                         _id: null,
    //                         totalBookings: { $sum: 1 },
    //                         confirmedBookings: { $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] } },
    //                         totalRevenue: { $sum: "$totalPrice" }
    //                     }
    //                 }
    //             ]);
    //             console.log(bookingsAggregation)
    
    //             // Aggregate reviews data (assuming reviews are stored in the 'reviews' field of the tour)
    //             const reviewsAggregation = await Review.aggregate([
    //                 { $match: { tour: new mongoose.Types.ObjectId(tourId) } }, // Filter reviews by tour ID
    //                 {
    //                     $group: {
    //                         _id: null,
    //                         totalReviews: { $sum: 1 },
    //                         averageRating: { $avg: "$rating" }
    //                     }
    //                 }
    //             ]);
    //             console.log(reviewsAggregation)
    
    //             // If no bookings or reviews data, set defaults
    //             const bookingsData = bookingsAggregation[0] || {
    //                 totalBookings: 0,
    //                 confirmedBookings: 0,
    //                 totalRevenue: 0
    //             };
    //             const reviewsData = reviewsAggregation[0] || {
    //                 totalReviews: 0,
    //                 averageRating: 0
    //             };
    
    //             // Add the aggregated data to the tour object
    //             reviewsDataa = reviewsData;
    //             bookingsDataa = bookingsData;
    //         }
    
    //         // Send the response
    //         response(res, 200, {...tour,bookingsDataa,reviewsDataa}, 'Tour retrieved successfully');
    //     } catch (err) {
    //         next(err);
    //     }
    // }
    




    // async getTourById(req, res, next) {
    //     try {
    //         const tour = await TourService.getTourById(req.params.id);
    //         response(res, 200, tour, 'Tour retrieved successfully');
    //     } catch (err) {
    //         next(err);
    //     }
    // }

    async updateTour(req, res, next) {

        // Define the generateValidFilePath function here
        const generateValidFilePath = (filename) => {
            return filename.replace(/\\/g, '/'); // Replace all backslashes with forward slashes
        };
    
        if (req.files && req.files.image) {
            console.log(req.files)
            const imagePath = generateValidFilePath(req.files.image[0].path);
            req.body.image = imagePath;
    
            // Generate thumbnail for the main image
            const thumbnailPath = await ImageService.createThumbnail(imagePath, path.dirname(imagePath));
            req.body.imagesthubnails = [generateValidFilePath(thumbnailPath)];
        }
        try {
            const isAdmin = req.headers.role === 'vendor';
            const tour = await TourService.updateTour(req.params.id, req.body,isAdmin);
            response(res, 200, tour, 'Tour updated successfully');
        } catch (err) {
            next(err);
        }
    }
    

    async deleteTour(req, res, next) {
        try {
            await TourService.deleteTour(req.params.id);
            response(res, 200, null, 'Tour deleted successfully');
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new TourController();




