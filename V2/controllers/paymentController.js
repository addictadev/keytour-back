const stripeService = require('../services/stripeService');
const Booking = require('../../src/model/BookingModel');
const Tour = require('../../src/model/ToursModel');
const User = require('../../src/model/UserModel');
const Notification = require('../../src/model/NotificationModel');
const emailService = require('../../src/utils/emailService');
const admin = require('../../firebase/firebaseAdmin');
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const CustomError = require('../../src/utils/customError');


class PaymentController {
    async createPaymentSession(req, res) {
        try {
            const { orderId, userId } = req.body;

            // Find and validate booking
            const booking = await Booking.findById(orderId).populate('tour');
            
            // Validation checks
            if (!booking) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Booking not found' 
                });
            }

            if (booking.tour.capacity === 'full') {
                return res.status(400).json({ 
                    success: false,
                    message: 'The tour is full' 
                });
            }

            if (booking.status !== 'pending') {
                return res.status(400).json({ 
                    success: false,
                    message: 'This tour may be cancelled or at full capacity' 
                });
            }

            if (booking.user.toString() !== userId) {
                return res.status(404).json({ 
                    success: false,
                    message: 'User not found' 
                });
            }

            // Create Stripe session
            const session = await stripeService.createPaymentSession(
                booking.totalPrice,
                `${process.env.FRONTEND_URL}/payment/success?orderId=${orderId}`,
                `${process.env.FRONTEND_URL}/payment/cancel`,
                {
                    bookingId: orderId,
                    userId: userId,
                    tourId: booking.tour._id.toString()
                }
            );

            // Update booking with session details
            await Booking.findByIdAndUpdate(orderId, {
                sessionId: session.id,
                paymentUrl: session.url
            }, { 
                new: true,
                validateBeforeSave: false 
            });

            res.status(200).json({
                success: true,
                sessionId: session.id,
                paymentUrl: session.url,
                message: 'Payment Link retrieved successfully'
            });

        } catch (error) {
            console.error('Error creating session:', error);
            res.status(500).json({
                success: false,
                message: 'Session creation failed',
                error: error.message
            });
        }
    }

    async handleWebhook(req, res) {
        const sig = req.headers['stripe-signature'];
        console.log('Webhook received:', req.body);
        console.log('Webhook sig:',sig);

        try {
        //    const event = stripe.webhooks.constructEvent(
      //          req.body, // raw body
    //            sig,
  //              process.env.STRIPE_WEBHOOK_SECRET
 //           );
//            console.log('Webhook event:',event);


 const event = req.body;
            if (event.type === 'checkout.session.completed') {
                const session = event.data.object;
                const { bookingId, userId, tourId } = session.metadata;

                // Update booking status
                const booking = await Booking.findByIdAndUpdate(bookingId, {
                    paymentStatus: 'paid',
                    status: 'confirmed'
                }).populate('tour').populate('user').populate('vendor');

                if (!booking) {
                    console.error(`Webhook: Booking not found for ID: ${bookingId}`);
                    return res.json({ received: true }); // Acknowledge webhook
                }

                // --- Send Email Notifications ---
                try {
                    // Notify User
                    const userHtml = emailService.createPaymentSuccessHTML(booking.user, booking);
                    await emailService.sendEmail(booking.user.email, 'Your Payment was Successful!', userHtml);

                    // Notify Vendor
                    if (booking.vendor) {
                        const vendorHtml = emailService.createBookingConfirmedForVendorHTML(booking.vendor, booking.user, booking);
                        await emailService.sendEmail(booking.vendor.email, `New Confirmed Booking for ${booking.tour.title}`, vendorHtml);
                    }
                } catch (emailError) {
                    console.error('Failed to send payment success emails:', emailError);
                }

                // Check tour capacity
                const tour = await Tour.findById(tourId);
                if (tour) {
                    const bookingsCount = await Booking.countDocuments({
                        tour: tourId,
                        status: 'confirmed'
                    });

                    if (bookingsCount >= tour.maxCapacity) {
                        await Tour.findByIdAndUpdate(tourId, {
                            capacity: 'full'
                        });
                    }
                }

                // Send notification
                const user = await User.findById(userId);
                if (user?.fcmtoken) {
                    try {
                        await admin.messaging().send({
                            notification: {
                                title: 'Payment Successful',
                                body: `Your payment for ${booking.tour.title} was successful!`
                            },
                            data: {
                                bookingId,
                                tourId,
                                type: 'payment_success'
                            },
                            token: user.fcmtoken
                        });

                        await Notification.create({
                            user: userId,
                            tourid: tourId,
                            title: 'Payment Successful',
                            message: `Your payment for ${booking.tour.title} was successful. Amount: ${booking.totalPrice} EGP`,
                            type: 'payment',
                            booking: bookingId
                        });
                    } catch (notificationError) {
                        console.error('Notification error:', notificationError);
                    }
                }
            }

            res.json({ received: true });
        } catch (error) {
            console.error('Webhook error:', error);
            return res.status(400).json({
                success: false,
                message: 'Webhook error',
                error: error.message
            });
        }
    }
}

module.exports = new PaymentController();
