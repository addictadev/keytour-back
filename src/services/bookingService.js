const Booking = require('../model/BookingModel');
const User = require('../model/UserModel'); // Import the User model
const Vendor = require('../model/VendorModel'); // Import the Vendor model
const Admin = require('../model/AdminModel'); // Import the Admin model
const emailService = require('../utils/emailService'); // Import the EmailService
const CustomError = require('../utils/customError');
const Notification = require('../model/NotificationModel')
const admin = require('../../firebase/firebaseAdmin');
const APIFeatures = require('../utils/apiFeatures');
const { scheduleAllEvents } = require('../cronScheduler');
const mongoose = require('mongoose'); 
const moment = require('moment');
class BookingService {
    // Create a new booking and link it to the user
    // async createBooking(data) {
    //     const booking = new Booking(data);
    //     await booking.save();

    //     // Add booking reference to the user's bookings array
    //     const user = await User.findById(booking.user);
    //     if (!user) throw new CustomError('User not found', 404);

    //     user.bookings.push(booking._id);
    //     await user.save();

    //     return booking;
    // }

    // async (bookingId, userId) {
    //     // Find the booking by ID and ensure it belongs to the correct user
    //     const bookingObjectId = new mongoose.Types.ObjectId(bookingId);
    //     const userObjectId = new mongoose.Types.ObjectId(userId);
      
    
    //     // Find the booking by ID and user
    //     const booking = await Booking.findOne({ _id:bookingId, user:userId });
      
    //     if (!booking) {
    //       throw new CustomError('Booking not found', 404);
    //     }
      
    //     // Check if the booking can be cancelled
    //     if (booking.opentopaid || new Date() >= new Date(booking.startDate)) {
    //       throw new CustomError('Booking cannot be cancelled. Either payment is open or the tour has started.', 400);
    //     }
      
    //     // Cancel the booking by setting the status to 'cancelled'
    //     booking.status = 'cancelled';
    //     await booking.save();
      
    //     return booking;
    //   }



    
    async createBooking(data) {
        const existingBooking = await Booking.findOne({
            user: data.user,
            tour: data.tour,
        });
        if (new Date() >= new Date(data.startDate)) {
            throw new CustomError(`Booking cannot be created. the start date you enter expired ${data.startDate}.`, 400);
          }
        

        // if (existingBooking) {
        //     throw new CustomError('You have already booked this tour', 400);
        // }
    
        const booking = new Booking(data);
        await booking.save();
    
        // Add booking reference to the user's bookings array
        const user = await User.findById(booking.user);
        if (!user) {
            throw new CustomError('User not found', 404);
        }
    
        user.bookings.push(booking._id);
        await user.save();
    
        // --- Send Email Notifications ---
        try {
            // Populate necessary details for email
            await booking.populate([
                { path: 'user', select: 'name email' },
                { path: 'tour', select: 'title' },
                { path: 'vendor', select: 'name email' }
            ]);

            // 1. Send confirmation to User
            const userHtml = emailService.createBookingConfirmationHTML(booking.user, booking);
            await emailService.sendEmail(booking.user.email, 'Your Booking Request has been Received', userHtml);

            // 2. Send notification to Vendor
            if (booking.vendor) {
                const vendorHtml = emailService.createVendorNotificationHTML(booking.vendor, booking.user, booking);
                await emailService.sendEmail(booking.vendor.email, `New Booking for ${booking.tour.title}`, vendorHtml);
            }

            // 3. Send notification to all Admins
            const admins = await Admin.find({}, 'name email');
            for (const adminUser of admins) {
                const adminHtml = emailService.createAdminNotificationHTML(adminUser, booking.user, booking.vendor, booking);
                await emailService.sendEmail(adminUser.email, 'New Booking Created in System', adminHtml);
            }

        } catch (emailError) {
            console.error('Failed to send booking notification emails:', emailError);
            // We don't throw an error here because the booking itself was successful.
            // This can be handled by a more robust logging or retry mechanism.
        }

        // Send notification to the user if they are logged in and have an FCM token
        if (user.isLogin && user.fcmtoken) {
            const message = {
                notification: {
                    title: 'Booking Created',
                    body: `Your booking for tour has been created successfully.`
                },
                token: user.fcmtoken,
            };
    
            try {
                // Send notification via FCM
                await admin.messaging().send(message);
    
                // Save the notification to the database
                const notification = new Notification({
                    user: user._id,
                    tourid: booking.tour, // Assuming tour ID is stored in booking.tour
                    title: 'Booking Created',
                    message: `Your booking for tour has been created successfully.`
                });
                await notification.save();
            } catch (error) {
                if (error.code === 'messaging/registration-token-not-registered') {
                    console.error('FCM token is not registered:', error.message);
                    // You may want to update the user's FCM token field to null or handle it as per your logic
                    user.fcmtoken = null;
                    await user.save();
                } else {
                    console.error('Error sending FCM message:', error.message);
                }
            }
        }
        scheduleAllEvents(booking?._id, booking?.datetopiad);
        return booking;
    }
    

    








    // async createBooking(data) {


    //     const existingBooking = await Booking.findOne({
    //         user: data.user,
    //         tour: data.tour,
    //       });
    //       console.log("existingBooking")
    //       console.log(existingBooking)

    //       if (existingBooking) throw new CustomError('you are already added booking this tour', 400);
     
          








    //     const booking = new Booking(data);
    //     await booking.save();

    //     // Add booking reference to the user's bookings array
    //     const user = await User.findById(booking.user);
    //     if (!user) throw new CustomError('User not found', 404);

    //     user.bookings.push(booking._id);
    //     await user.save();

    //     // Send notification to the user if they are logged in and have an FCM token
    //     if (user.isLogin && user.fcmtoken) {
    //         const message = {
    //             notification: {
    //                 title: 'Booking Created',
    //                 body: `Your booking for tour  has been created successfully.`
    //             },
    //             token: user.fcmtoken,
    //         };

    //         // Send notification via FCM
    //         await admin.messaging().send(message);

    //         // Save the notification to the database
    //         const notification = new Notification({
    //             user: user._id,
    //             tourid: booking.tour, // Assuming tour ID is stored in booking.tour
    //             title: 'Booking Created',
    //             message: `Your booking for tour has been created successfully.`
    //         });
    //         await notification.save();
    //     }

    //     return booking;
    // }






    async getAllBookings(queryParams) {
        const filter = {};
        
        // Check if vendor._id exists and include it in the filter for pending and accepted counts
        if (queryParams.vendor && queryParams.vendor) {
            filter['vendor'] = queryParams.vendor; // Assuming vendor._id is the correct field structure in your Booking schema
        }
    
        // Count pending and accepted bookings for the vendor (if vendor exists in the query)
        const pendingCount = await Booking.countDocuments({ ...filter, status: 'pending' });
        const acceptedCount = await Booking.countDocuments({ ...filter, status: 'confirmed' });
    
        // Log pending and accepted counts
        console.log(`Pending count: ${pendingCount}, Accepted count: ${acceptedCount}`);
    
        // Use the filter in your query
        const features = new APIFeatures(Booking.find(filter).populate('user', 'name phone'), queryParams)
            .filter()
            .sort()
            .limitFields()
            .paginate();
    
        const destinations = await features.query;
    
        return {
            results: destinations.length,
            pendingCount,     // Include pending count in the response
            acceptedCount,    // Include accepted count in the response
            data: destinations
        };
    }
    









    // Process payment for a booking
    async processPayment(bookingId, paymentData) {
        const booking = await Booking.findById(bookingId);
        if (!booking) throw new CustomError('Booking not found', 404);
        if (booking.payment_status !== 'pending') throw new CustomError('Payment already processed', 400);

        // Simulate payment processing
        const isPaymentSuccessful = this.simulateVisaPayment(paymentData);

        if (isPaymentSuccessful) {
            booking.paymentStatus = 'paid';
            await booking.save();
        } else {
            throw new CustomError('Payment failed', 400);
        }

        return booking;
    }

    // Simulate payment processing (this is a mock function)
    simulateVisaPayment(paymentData) {
        // In a real scenario, you would integrate with a payment gateway here
        // For this simulation, we'll assume the payment is always successful if the card number is valid
        const { cardNumber, expiryDate, cvv } = paymentData;
        if (cardNumber && expiryDate && cvv) {
            return true;
        }
        return false;
    }

    // Cancel a booking - send emails to user, vendor, and admins
    async cancelBooking(bookingId, cancellerUser) {
        const booking = await Booking.findById(bookingId)
            .populate('user')
            .populate('vendor')
            .populate('tour');
        if (!booking) {
            throw new CustomError('Booking not found', 404);
        }

        const isUserCancelling = booking.user._id.toString() === cancellerUser._id.toString();
        const isVendorCancelling = booking.vendor && booking.vendor._id.toString() === cancellerUser._id.toString();
        const isAdminCancelling = cancellerUser.defaultrole === 'admin';

        if (!isUserCancelling && !isVendorCancelling && !isAdminCancelling) {
            throw new CustomError('You are not authorized to cancel this booking.', 403);
        }

        if (booking.status.startsWith('cancel')) {
            throw new CustomError('Booking has already been canceled.', 400);
        }

        const cancelledBy = isUserCancelling ? 'user' : (isVendorCancelling ? 'vendor' : 'admin');

        if (isUserCancelling) {
            booking.status = 'canceled';
        } else {
            booking.status = 'canceledbyvendor';
        }

        await booking.save({ validateBeforeSave: false });

        // Collect email send promises
        const emailPromises = [];

        try {
            // 1) Notify User
            if (isUserCancelling) {
                // Confirmation to user who cancelled
                const userHtml = emailService.createUserCancellationConfirmationHTML(booking.user, booking);
                emailPromises.push(
                    emailService.sendEmail(booking.user.email, `Your Booking for ${booking.tour.title} has been cancelled`, userHtml)
                );
            } else {
                // Vendor/Admin cancelled → notify user
                const userHtml = emailService.createCancellationNotificationForUserHTML(booking.user, booking);
                emailPromises.push(
                    emailService.sendEmail(booking.user.email, `Your Booking for ${booking.tour.title} has been cancelled`, userHtml)
                );
            }

            // 2) Notify Vendor (if exists)
            if (booking.vendor) {
                if (isUserCancelling) {
                    // User cancelled → existing template to vendor
                    const vendorHtml = emailService.createCancellationNotificationForVendorHTML(booking.vendor, booking.user, booking);
                    emailPromises.push(
                        emailService.sendEmail(booking.vendor.email, `Booking Cancellation for ${booking.tour.title}`, vendorHtml)
                    );
                } else {
                    // Vendor/Admin cancelled → notify vendor as a record
                    const vendorHtml = emailService.createVendorCancellationNotificationHTML(booking.vendor, booking.user, booking, cancelledBy);
                    emailPromises.push(
                        emailService.sendEmail(booking.vendor.email, `Booking Cancelled (${cancelledBy}) - ${booking.tour.title}`, vendorHtml)
                    );
                }
            }

            // 3) Notify Admins
            const admins = await Admin.find({}, 'name email');
            for (const adminUser of admins) {
                const adminHtml = emailService.createAdminCancellationNotificationHTML(adminUser, booking.user, booking.vendor, booking, cancelledBy);
                emailPromises.push(
                    emailService.sendEmail(adminUser.email, `Booking Cancelled (${cancelledBy})`, adminHtml)
                );
            }

            // Execute all email sends in parallel
            await Promise.allSettled(emailPromises);
        } catch (emailError) {
            console.error('Failed to send one or more booking cancellation emails:', emailError);
        }

        return booking;
    }
    async delete(bookingId) {
        const booking = await Booking.findByIdAndDelete(bookingId);
        // if (!booking) throw new CustomError('Booking not found', 404);
        // if (booking.payment_status === 'canceled') throw new CustomError('Booking already canceled', 400);

        // booking.payment_status = 'canceled';
        // await booking.save();

        return booking;
    }
    async deleteManya() {
        const booking = await Booking.deleteMany();
        // if (!booking) throw new CustomError('Booking not found', 404);
        // if (booking.payment_status === 'canceled') throw new CustomError('Booking already canceled', 400);

        // booking.payment_status = 'canceled';
        // await booking.save();

        return booking;
    }

    async updateBooking(bookingId, updateData, user) {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            throw new CustomError('Booking not found', 404);
        }

        // Authorization: Only the vendor of the tour or an admin can update the booking
        if (user.defaultrole !== 'admin' && booking.vendor.toString() !== user._id.toString()) {
            throw new CustomError('You are not authorized to update this booking', 403);
        }

        const oldStatus = booking.status;
        const newStatus = updateData.status;

        // Update the booking with new data
        Object.assign(booking, updateData);
        const updatedBooking = await booking.save();

        await updatedBooking.populate('user tour');

        // Check if the status has changed and send an email
        if (newStatus && oldStatus !== newStatus) {
            try {
                let html, subject;
                if (newStatus === 'confirmed') {
                    html = emailService.createBookingConfirmedHTML(updatedBooking.user, updatedBooking);
                    subject = `Your Booking for ${updatedBooking.tour.title} is Confirmed!`;
                } else if (newStatus === 'rejected' || newStatus === 'canceled' || newStatus === 'canceledbyvendor') {
                    html = emailService.createBookingRejectedHTML(updatedBooking.user, updatedBooking);
                    subject = `Update on Your Booking for ${updatedBooking.tour.title}`;
                }

                if (html && subject) {
                    await emailService.sendEmail(updatedBooking.user.email, subject, html);
                }
            } catch (emailError) {
                console.error('Failed to send booking status update email:', emailError);
            }
        }

        return updatedBooking;
    }
}

module.exports = new BookingService();
