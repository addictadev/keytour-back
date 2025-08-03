const Tour = require('../model/ToursModel');
const CustomError = require('../utils/customError');
const APIFeatures = require('../utils/apiFeatures');
const Booking = require('../model/BookingModel'); 
const Destination = require('../model/DestinationModel'); // Import the Booking model
// Import the Booking model
const Review = require('../model/ReviewModel');
const User = require('../model/UserModel');
const admin = require('../../firebase/firebaseAdmin');
const mongoose = require('mongoose');
class TourService {






  
  async getUserBookingInfo(tourId)  {
      // Fetch the tour by ID
      const tour = await Tour.findById(tourId);
      if (!tour) {
          throw new CustomError('Tour not found', 404);
      }
  
      // Check if the tour is canceled by admin
      if (tour.cancelByVendor) {
          // If canceled, fetch all bookings for the tour
          const bookings = await Booking.find({ tour: tourId , status:"canceledbyvendor",paymentStatus:"paid" });
  
          // If no bookings are found, throw an error
          if (!bookings || bookings.length === 0) {
              throw new CustomError('No bookings found for this tour', 404);
          }
  
          // Fetch user details for all bookings
          const userIds = bookings.map(booking => booking.user);
          const users = await User.find({ '_id': { $in: userIds } });
  
          // Prepare the response data with bookings and user information
          const bookingUserInfo = bookings.map(booking => {
            // console.log('aaaaaaaaaaa',booking)
              const user = users.find(u => u._id.toString() === booking.user.toString());
              return {
                  bookingId: booking._id,
                  userId: user._id,
                  userName: user.name,
                  phone: user?.phone,
                  userEmail: user.email,
                  bookingStatus: booking.status,
                  bookingDate: booking.bookingDate,
                  price: booking.totalPrice,
                  tourtitle: booking.tour.title
              };
          });
  
          return {
              tourId: tour._id,
              tourName: tour.name,
              canceledBy: tour.canceledBy,
              canceledDate: tour.canceledDate,
              bookingUserInfo
          };
      } else {
          throw new CustomError('Tour is not canceled by admin', 400);
      }
  };
  

  































     async cancelTour(vendorId, tourId) {
        // Find the tour to cancel
        const tour = await Tour.findById(tourId);
      
        if (!tour) {
          throw new CustomError('Tour not found', 404);
        }
      
        if (tour.vendor.toString() !== vendorId.toString()) {
          throw new CustomError('You are not authorized to cancel this tour', 403);
        }
      
        // Set cancelByVendor flag to true
        tour.cancelByVendor = true;
        tour.status='cancelled'
        await tour.save({ validateBeforeSave: false });
      
        // Find all bookings for this tour with 'confirmed' or 'pending' status
        const bookings = await Booking.find({
          tour: tourId,
          status: { $in: ['confirmed', 'pending'] }, // Match both 'confirmed' and 'pending' statuses
        });
      
        const notifications = [];
      
        // Update all bookings' status to 'canceledbyvendor' at once using updateMany
         await Booking.updateMany(
          { tour: tourId, status: { $in: ['confirmed', 'pending'] } },
          { $set: { status: 'canceledbyvendor' , opentopaid:false} }
        );
      
        // Send cancellation notifications to all affected users
        for (const booking of bookings) {
          const user = await User.findById(booking.user);
      
          if (user && user.fcmtoken) {
            const message = {
              notification: {
                title: 'Tour Cancelled',
                body: `The tour "${tour.title}" has been cancelled by the vendor. We apologize for the inconvenience.`,
              },
              token: user.fcmtoken,
            };
      
            try {
              // Send notification via FCM
              await admin.messaging().send(message);
      
              // Save the notification in the database (optional)
              const notification = new Notification({
                user: user._id,
                tourid: tour._id,
                title: 'Tour Cancelled',
                message: `The tour "${tour.title}" has been cancelled by the vendor.`,
              });
              await notification.save();
              notifications.push(notification);
            } catch (error) {
              console.error('Error sending notification to user:', error);
            }
          }
        }
      
        return notifications;
      }
      



      async fullcapacity(vendorId, tourId) {
        // Find the tour to cancel
        const tour = await Tour.findById(tourId);
      
        if (!tour) {
          throw new CustomError('Tour not found', 404);
        }
      
        if (tour.vendor.toString() !== vendorId.toString()) {
          throw new CustomError('You are not authorized to cancel this tour', 403);
        }
      
        // Set cancelByVendor flag to true
        tour.capacity = "full";
        await tour.save({ validateBeforeSave: false });
      
        // Find all bookings for this tour with 'confirmed' or 'pending' status
        const bookings = await Booking.find({
          tour: tourId,
          status: { $in: ['pending'] }, // Match both 'confirmed' and 'pending' statuses
        }).populate('user');
      
        const notifications = [];
      
        // Update all bookings' status to 'canceledbyvendor' at once using updateMany
        await Booking.updateMany(
          { tour: tourId, status: { $in: ['pending'] } },
          { $set: { status: 'full capacity' } }
        );
      let fcm = bookings.map((el)=>el.user.fcmtoken)
      // if (fcm){
      //   try {
      //     const message = {
      //       notification: {
      //         title: 'Tour Capacity',
      //         body: `The tour "${tour.title}" has been fully capacity by the vendor. We apologize for the inconvenience.`,
      //       },
   
      //     };
      //     // Send notification via FCM
      //     await admin.messaging().sendEachForMulticast(fcm,message);
  
      //     // Save the notification in the database (optional)
   
      //   } catch (error) {
      //     console.error('Error sending notification to user:', error);
      //   }
      // }
        // Send cancellation notifications to all affected users
        for (const booking of bookings) {
          const user = await User.findById(booking.user);

          if (user && user.fcmtoken) {
            const message = {
              notification: {
                title: 'Tour Capacity',
                body: `The tour "${tour.title}" has been fully capacity by the vendor. We apologize for the inconvenience.`,
              },
              token: user.fcmtoken,
            };
      
            try {
              // Send notification via FCM
              await admin.messaging().send(message);
      
              // Save the notification in the database (optional)
              const notification = new Notification({
                user: user._id,
                tourid: tour._id,
                title: 'Tour Capacity',
                message: `The tour "${tour.title}" has been fully capacity by the vendor.`,
              });
              await notification.save();
              notifications.push(notification);
            } catch (error) {
              console.error('Error sending notification to user:', error);
            }
          }
        }
      
        return notifications;
      }








    async createTour(data) {
        const tour = new Tour(data);
        await tour.save();
        return tour;
    }
    async updateTourStatus(tourId, status) {
        const tour = await Tour.findById(tourId);
        if (!tour) {
            throw new CustomError('Tour not found', 404);
        }

        if (!['pending', 'accepted', 'rejected'].includes(status)) {
            throw new CustomError('Invalid status', 400);
        }

        if (status=='rejected'){
            tour.resend=true
        }
        tour.status = status;
        tour.resend = false
        tour.cancelByVendor = false

        await tour.save({validateBeforeSave:false});

        return tour;
    }

    async getTourById(id) {
        const tour = await Tour.findById(id).populate('reviews').populate('AvailabilityDays');
        if (!tour) {
            throw new CustomError('Tour not found', 404);
        }
        return tour;
    }
    // async getAllTours(queryParams) {
    //     const filter = {};
    //     let counts = await Tour.find().countDocuments();

    //     const features = new APIFeatures(Tour.find(filter), queryParams)
    //         .filter()
    //         .sort()
    //         .limitFields()
    //         .paginate();

    //     const tours = await features.query;
    //     return {
    //         results: tours.length,
    //         counts: counts,
    //         data: tours
    //     };
    // }
  //   async getAllTours(queryParams,role,x) {
  
  //     const filter = {};
  //     const pendingCount = await Tour.countDocuments({ status: 'pending' });
  //     const acceptedCount = await Tour.countDocuments({ status: 'accepted' });
  //     const rejectedCount = await Tour.countDocuments({ status: 'rejected' });

  //     const counts = await Tour.find().countDocuments();
  //     if(role)
  //     {
  //     const currentDate = new Date();
  // filter['availability.to'] = { $gte: currentDate }
  //     }
  //     const features = new APIFeatures(Tour.find(filter), queryParams)
  //         .filter()
  //         .sort()
  //         .limitFields()
  //         .paginate();
  
  //     const tours = await features.query;
  //     tours.wishlist=undefined;
  //   //   if (x) {
  //   //     // Populate the destination fields with tourcount and rating
  //   //     for (let tour of tours) {
  //   //         if (tour.destination) {
  //   //             const destination = await Destination.findById(tour.destination);

  //   //             // Count the number of tours related to this destination
  //   //             const tourCount = await Tour.countDocuments({ destination: destination._id });
  //   //             destination.tourcount = tourCount;

  //   //             // Calculate the average rating of the tours related to this destination
  //   //             const toursForDestination = await Tour.find({ destination: destination._id });
  //   //             // console.log(toursForDestination)
  //   //             const totalRating = toursForDestination.reduce((sum, tour) => sum + tour.ratings.average, 0);
  //   //             console.log(destination)

  //   //             destination.rating = toursForDestination.length > 0 ? totalRating / toursForDestination.length : 0;

  //   //             // Attach the updated destination to the tour's destination object
  //   //             tour.destination = {
  //   //                 ...destination.toObject(),
  //   //                 rating: destination.rating,
  //   //                 tourcount: destination.tourcount
  //   //             };
  //   //         }
  //   //     }
  //   // }

  //   const destinationCache = {};
  //   if (x) {
  //     // Loop through tours and populate destination only once for each destination ID
  //     for (let tour of tours) {
  //       if (tour.destination) {
  //           const destinationId = tour.destination; // Assuming this is the ObjectId of the destination
  //           const destination = await Destination.findById(destinationId);
    
  //           // Count the number of tours related to this destination
  //           const tourCount = await Tour.countDocuments({ destination: destination._id });
  //           destination.tourcount = tourCount;
    
  //           // Calculate the average rating of the tours related to this destination
  //           const toursForDestination = await Tour.find({ destination: destination._id });
  //           const totalRating = toursForDestination.reduce((sum, tour) => sum + tour.ratings.average, 0);
    
  //           destination.rating = toursForDestination.length > 0 ? totalRating / toursForDestination.length : 0;
    
  //           // Attach the updated destination to the tour's destination object
  //           tour.destination = {
  //               ...destination.toObject(),
  //               rating: destination.rating,
  //               tourcount: destination.tourcount
  //           };
  //       }
  //   }
    
  // }
  //     return {
  //         results: tours.length,
  //         counts: counts,
  //         pendingCount: pendingCount,
  //         acceptedCount: acceptedCount,
  //         rejectedCount: rejectedCount,
  //         data: tours
  //     };
  // }
// Assuming you have a utility class for API features
  





// async  getAllTours(queryParams, role, x) {
//     const filter = {};

//     // Count documents for status-based counts
//     const pendingCount = await Tour.countDocuments({ status: 'pending' });
//     const acceptedCount = await Tour.countDocuments({ status: 'accepted' });
//     const rejectedCount = await Tour.countDocuments({ status: 'rejected' });

//     const totalCount = await Tour.countDocuments();

//     // Filter based on availability if role is provided
//     if (role) {
//         const currentDate = new Date();
//         filter['availability.to'] = { $gte: currentDate };
//     }

//     // Apply query params for filtering, sorting, pagination
//     const features = new APIFeatures(Tour.find(filter), queryParams)
//         .filter()
//         .sort()
//         .limitFields()
//         .paginate();

//     const tours = await features.query;

//     // Remove wishlist if not needed
//     tours.forEach(tour => {
//         tour.wishlist = undefined;
//     });

//     // If 'x' is true, populate the destination data
//     if (x) {
//         const destinationCache = {}; // To avoid repeated database calls for the same destination

//         // Loop through tours and populate destination details
//         for (let tour of tours) {
//           if (tour.destination && tour.destination._id) {
//             const destinationId = tour.destination._id.toString();
       

//                 // Check if the destination is already cached
//                 if (!destinationCache[destinationId]) {
//                     // If not cached, fetch the destination data
//                     const destination = await Destination.findById(new mongoose.Types.ObjectId(destinationId));
                   
              


//                     if (destination) {
//                         // Cache the destination data to avoid re-fetching it
//                         destinationCache[destinationId] = destination;

//                         // Count the number of tours related to this destination
//                         const tourCount = await Tour.countDocuments({ destination: destination._id });
//                         destination.tourcount = tourCount;

//                         // Calculate the average rating of the tours related to this destination
//                         const toursForDestination = await Tour.find({ destination: destination._id });
//                         const totalRating = toursForDestination.reduce((sum, tour) => sum + tour.ratings.average, 0);

//                         destination.rating = toursForDestination.length > 0 ? totalRating / toursForDestination.length : 0;
//                     }
//                 }

//                 // Attach the cached or fetched destination data to the tour
//                 const destination = destinationCache[destinationId];
//                 console.log('destinationId',destination)
//                 tour.destination = {
//                     ...destination.toObject(),
//                     rating: destination.rating,
//                     tourcount: destination.tourcount
//                 };
//             }
//         }
//     }

//     return {
//         results: tours.length,
//         counts: totalCount,
//         pendingCount: pendingCount,
//         acceptedCount: acceptedCount,
//         rejectedCount: rejectedCount,
//         data: tours
//     };
// }

// async getAllTours(queryParams, role, x) {
//   const filter = {};

//   // Count documents for status-based counts
//   const pendingCount = await Tour.countDocuments({ status: 'pending' });
//   const acceptedCount = await Tour.countDocuments({ status: 'accepted' });
//   const rejectedCount = await Tour.countDocuments({ status: 'rejected' });
//   const totalCount = await Tour.countDocuments();

//   // Filter based on availability if role is provided
//   if (role) {
//       const currentDate = new Date();
//       filter['availability.to'] = { $gte: currentDate };
//   }

//   // Apply query params for filtering, sorting, pagination
//   const features = new APIFeatures(Tour.find(filter), queryParams)
//       .filter()
//       .sort()
//       .limitFields()
//       .paginate();

//   const tours = await features.query;

//   // Remove wishlist if not needed
//   tours.forEach(tour => {
//       tour.wishlist = undefined;
//   });

//   // If 'x' is true, populate the destination data
//   if (x) {
//       const destinationCache = {}; // To avoid repeated database calls for the same destination

//       // Create an array of promises for populating destinations
//       const populateDestinationsPromises = tours.map(async (tour) => {
//           if (tour.destination && tour.destination._id) {
//               const destinationId = tour.destination._id.toString();

//               // Check if the destination is already cached
//               if (!destinationCache[destinationId]) {
//                   // If not cached, fetch the destination data
//                   const destination = await Destination.findById(new mongoose.Types.ObjectId(destinationId));

//                   if (destination) {
//                       // Cache the destination data to avoid re-fetching it
//                       destinationCache[destinationId] = destination;

//                       // Count the number of tours related to this destination
//                       const tourCount = await Tour.countDocuments({ destination: destination._id });
//                       destination.tourcount = tourCount;

//                       // Calculate the average rating of the tours related to this destination
//                       const toursForDestination = await Tour.find({ destination: destination._id });
//                       const totalRating = toursForDestination.reduce((sum, tour) => sum + tour.ratings.average, 0);

//                       destination.rating = toursForDestination.length > 0 ? totalRating / toursForDestination.length : 0;
//                   }
//               }

//               // Attach the cached or fetched destination data to the tour
//               const destination = destinationCache[destinationId];
//               tour.destination = {
//                   ...destination.toObject(),
//                   rating: destination.rating,
//                   tourcount: destination.tourcount
//               };
//           }
//       });

//       // Wait for all promises to resolve
//       await Promise.all(populateDestinationsPromises);
//   }

//   return {
//       results: tours.length,
//       counts: totalCount,
//       pendingCount: pendingCount,
//       acceptedCount: acceptedCount,
//       rejectedCount: rejectedCount,
//       data: tours
//   };
// }


async getAllTours(queryParams, role, x) {
  const filter = {};

  // Count documents for status-based counts
  const pendingCount = await Tour.countDocuments({ status: 'pending' });
  const acceptedCount = await Tour.countDocuments({ status: 'accepted' });
  const rejectedCount = await Tour.countDocuments({ status: 'rejected' });
  const cancelledCount = await Tour.countDocuments({ status: 'cancelled' });

  const totalCount = await Tour.countDocuments();

  // Filter based on availability if role is provided
  if (role) {
      const currentDate = new Date();
      filter['availability.to'] = { $gte: currentDate };
  }

  // Apply query params for filtering, sorting, pagination
  const features = new APIFeatures(Tour.find(filter), queryParams)
      .filter()
      .sort()
      .limitFields()
      .paginate();

  const tours = await features.query;

  // Remove wishlist if not needed
  tours.forEach(tour => {
      tour.wishlist = undefined;
  });

  // If 'x' is true, populate the destination data
  if (x) {
      const destinationCache = {}; // To avoid repeated database calls for the same destination
      const destinationIdsSeen = new Set(); // Track already processed destination IDs

      // Create an array of promises for populating destinations
      const populateDestinationsPromises = tours.map(async (tour) => {
          if (tour.destination && tour.destination._id) {
              const destinationId = tour.destination._id.toString();

              // Check if the destination has already been added to the response
              if (!destinationIdsSeen.has(destinationId)) {
                  // Mark this destination as processed
                  destinationIdsSeen.add(destinationId);

                  // Check if the destination is already cached
                  if (!destinationCache[destinationId]) {
                      // If not cached, fetch the destination data
                      const destination = await Destination.findById(new mongoose.Types.ObjectId(destinationId));

                      if (destination) {
                          // Cache the destination data to avoid re-fetching it
                          destinationCache[destinationId] = destination;

                          // Count the number of tours related to this destination
                          const tourCount = await Tour.countDocuments({ destination: destination._id });
                          destination.tourcount = tourCount;

                          // Calculate the average rating of the tours related to this destination
                          const toursForDestination = await Tour.find({ destination: destination._id });
                          const totalRating = toursForDestination.reduce((sum, tour) => sum + tour.ratings.average, 0);

                          destination.rating = toursForDestination.length > 0 ? totalRating / toursForDestination.length : 0;
                      }
                  }

                  // Attach the cached or fetched destination data to the tour
                  const destination = destinationCache[destinationId];
                  tour.destination = {
                      ...destination.toObject(),
                      rating: destination.rating,
                      tourcount: destination.tourcount
                  };
              } else {
                  // If destination ID is already seen, remove the redundant destination data
                  tour.destination = null; // Or any other fallback value if needed
              }
          }
      });

      // Wait for all promises to resolve
      await Promise.all(populateDestinationsPromises);
  }

  // Filter out the tours where destination is null
  const filteredTours = tours.filter(tour => tour.destination !== null);

  return {
      results: filteredTours.length,
      counts: totalCount,
      pendingCount: pendingCount,
      acceptedCount: acceptedCount,
      rejectedCount: rejectedCount,
      cancelledCount:cancelledCount,
      data: filteredTours
  };
}

  

    async updateTour(id, data,vendor) {
      if (vendor){
        
        // data.status='pending'
        console.log(Object.keys(data))
        data.note=`this tour edit by vendor in fields  ${Object.keys(data)}`

        const tour = await Tour.findByIdAndUpdate(id, data, { new: true });
        if (!tour) {
          throw new CustomError('Tour not found', 404);
      }
      return tour;
      }
      const tour = await Tour.findByIdAndUpdate(id, data, { new: true });

        if (!tour) {
            throw new CustomError('Tour not found', 404);
        }
        return tour;
    }

    // async deleteTour(id) {
    //     const tour = await Tour.findByIdAndDelete(id);
    //     if (!tour) {
    //         throw new CustomError('Tour not found', 404);
    //     }
    //     return tour;
    // }

    async deleteTour(id) {
        // Find the tour
        const tour = await Tour.findById(id);
        if (!tour) {
            throw new CustomError('Tour not found', 404);
        }

        // Delete bookings associated with the tour
        await Booking.deleteMany({ tour: id });

        // Delete reviews associated with the tour
        await Review.deleteMany({ tour: id });

        // Delete the tour itself
        await Tour.findByIdAndDelete(id);

        return { message: 'Tour, related bookings, and reviews deleted successfully' };
    }


}

module.exports = new TourService();
