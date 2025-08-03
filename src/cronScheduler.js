// const cron = require('node-cron');
// const moment = require('moment');
// const Event = require('./model/eventSchema');

// // Function to schedule a cron job for each event
// const scheduleEventJob = (eventId, eventDate, eventTime) => {
//   // Combine the date and time into one moment object
//   const scheduledTime = moment(`${eventDate} ${eventTime}`, 'YYYY-MM-DD HH:mm');
  
//   // Check if the moment object is valid
//   if (!scheduledTime.isValid()) {
//     console.error('Invalid date/time format');
//     return;
//   }

//   // Convert the moment object to a cron expression
//   const cronExpression = `${scheduledTime.minute()} ${scheduledTime.hour()} ${scheduledTime.date()} ${scheduledTime.month() + 1} *`;

//   // Validate cron expression components
//   if (isNaN(scheduledTime.minute()) || isNaN(scheduledTime.hour()) || isNaN(scheduledTime.date()) || isNaN(scheduledTime.month())) {
//     console.error('Invalid cron expression generated');
//     return;
//   }

//   // Schedule the cron job
//   cron.schedule(cronExpression, async () => {
//     try {
//       console.log(`Cron job running for Event ID: ${eventId}`);

//       // Update the event status to 'completed'
//       const updatedEvent = await Event.findByIdAndUpdate(eventId, { status: 'completed' }, { new: true });
//       console.log(`Event completed: ${updatedEvent.name}`);
//     } catch (error) {
//       console.error('Error while running the cron job:', error);
//     }
//   });
// };

// // Fetch all events and schedule jobs
// const scheduleAllEvents = async () => {
//   const events = await Event.find({ status: 'scheduled' });
  
//   events.forEach(event => {
//     scheduleEventJob(event._id, event.date, event.time);
//   });
// };

// module.exports = { scheduleAllEvents };

// const cron = require('node-cron');
// const moment = require('moment');
// const Event = require('./model/eventSchema');

// // Function to schedule a cron job for each event
// const scheduleEventJob = (eventId, eventDate, eventTime) => {
//   // Log the received values to check if they are valid
//   console.log("Received eventDate:", eventDate);
//   console.log("Received eventTime:", eventTime);

//   // Convert eventDate to string if it's a Date object
//   if (eventDate instanceof Date) {
//     eventDate = eventDate.toISOString(); // or eventDate.toString() if you need a local format
//   }

//   // Trim any whitespace just in case
//   eventDate = eventDate.trim();
//   eventTime = eventTime.trim();

//   // Combine the date and time into one moment object
//   const scheduledTime = moment(`${eventDate} ${eventTime}`, 'YYYY-MM-DD HH:mm');

//   // Check if the moment object is valid
//   if (!scheduledTime.isValid()) {
//     console.error('Invalid date/time format:', `${eventDate} ${eventTime}`);
//     return;
//   }

//   // Convert the moment object to a cron expression
//   const cronExpression = `${scheduledTime.minute()} ${scheduledTime.hour()} ${scheduledTime.date()} ${scheduledTime.month() + 1} *`;

//   // Validate cron expression components
//   if (isNaN(scheduledTime.minute()) || isNaN(scheduledTime.hour()) || isNaN(scheduledTime.date()) || isNaN(scheduledTime.month())) {
//     console.error('Invalid cron expression generated');
//     return;
//   }

//   // Schedule the cron job
//   cron.schedule(cronExpression, async () => {
//     try {
//       console.log(`Cron job running for Event ID: ${eventId}`);

//       // Update the event status to 'completed'
//       const updatedEvent = await Event.findByIdAndUpdate(eventId, { status: 'completed' }, { new: true });
//       console.log(`Event completed: ${updatedEvent.name}`);
//     } catch (error) {
//       console.error('Error while running the cron job:', error);
//     }
//   });
// };

// // Fetch all events and schedule jobs
// const scheduleAllEvents = async () => {
//   const events = await Event.find({ status: 'scheduled' });
  
//   events.forEach(event => {
//     scheduleEventJob(event._id, event.date, event.time);
//   });
// };

// module.exports = { scheduleAllEvents };

const cron = require('node-cron');
const moment = require('moment');
const Booking = require('./model/BookingModel'); // Assuming Booking is your Mongoose model
const admin = require('../firebase/firebaseAdmin');
const Notification = require('./model/NotificationModel'); // Assuming this is the path to the Notification model

// Function to schedule cron job for opening payment
const scheduleAllEvents = (bookingId, paymentOpenDate) => {
  // Log the received paymentOpenDate to check if it's valid
  console.log("Received paymentOpenDate:", paymentOpenDate);

  // Convert paymentOpenDate to a moment object
  const scheduledTime = moment(paymentOpenDate);

  // Check if the moment object is valid
  if (!scheduledTime.isValid()) {
    console.error('Invalid paymentOpenDate:', paymentOpenDate);
    return;
  }

  // Convert the moment object to a cron expression
  const cronExpression = `${scheduledTime.minute()} ${scheduledTime.hour()} ${scheduledTime.date()} ${scheduledTime.month() + 1} *`;

  // Validate cron expression components
  if (isNaN(scheduledTime.minute()) || isNaN(scheduledTime.hour()) || isNaN(scheduledTime.date()) || isNaN(scheduledTime.month())) {
    console.error('Invalid cron expression generated');
    return;
  }

  // Schedule the cron job
  cron.schedule(cronExpression, async () => {
    try {
      console.log(`Cron job running for Booking ID: ${bookingId}`);

      const bookings = await Booking.findOne({
        _id: bookingId,
        paymentStatus: 'unpaid',
        opentopaid: false,
        status: { $in: ['cancelled', 'canceledbyvendor'] } // Exclude cancelled bookings
      });
      


if(bookings){
  console.log(`Booking not updated payment is now open.`);

  return;
}



      // Update the booking's opentopaid status to true
      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        { opentopaid: true },
        { new: true }
      );
      



      const user = await Booking.findById(bookingId).populate('user', 'isLogin fcmtoken').populate('tour','title').select('user tour');
      const notification = new Notification({
        user: user.user._id,
        tourid: user.tour,
        title: 'Payment Open Now',
        message: `Your payment for booking open you can paid now ${user.tour.title}.`,
      });
      await notification.save();
console.log("user",user)
      if (user.user.isLogin && user.user.fcmtoken) {
        const message = {
          notification: {
            title: 'Payment Open Now',
            body: `Your payment for booking open you can paid now ${user.tour.title}`,
          },
          token: user.user.fcmtoken,
        };

        // Send notification via FCM
        await admin.messaging().send(message);

        // Save the notification in the database
        // const notification = new Notification({
        //   user: user._id,
        //   tourid: booking.tour._id,
        //   title: 'Payment Open Now',
        //   message: `Your payment for booking open you can paid now ${user.tour.title}.`,
        // });
        // await notification.save();
      }







      console.log(`Booking ${updatedBooking._id} payment is now open.`);
    } catch (error) {
      console.error('Error while running the cron job:', error);
    }
  });
};

// Function to schedule payment open for all bookings
// const scheduleAllBookings = async () => {
//   // Fetch all bookings that are not yet opened for payment
//   // const bookings = await Booking.find({ opentopaid: false });
//   const bookings = await Booking.find({
//     opentopaid: false,
//     status: { $nin: ['cancelled', 'cancelled by admin'] } // Exclude cancelled bookings
//   });

//   bookings.forEach(booking => {
//     // Calculate the payment open date (startDate - availabilityToCancel)
//     // const paymentOpenDate = moment(booking.startDate).subtract(booking.tour.availabilityToCancel, 'days');

//     // Schedule a cron job for each booking
//     schedulePaymentOpen(booking.datetopiad, paymentOpenDate);
//   });
// };

module.exports = { scheduleAllEvents };











// const scheduleAllEvents = async (bookingId, paymentOpenDate) => {
//   // Log the received paymentOpenDate to check if it's valid
//   console.log("Received paymentOpenDate:", paymentOpenDate);

//   // Convert paymentOpenDate to a moment object
//   const scheduledTime = moment(paymentOpenDate);

//   // Check if the moment object is valid
//   if (!scheduledTime.isValid()) {
//     console.error('Invalid paymentOpenDate:', paymentOpenDate);
//     return;
//   }

//   // Convert the moment object to a cron expression
//   const cronExpression = `${scheduledTime.minute()} ${scheduledTime.hour()} ${scheduledTime.date()} ${scheduledTime.month() + 1} *`;

//   // Validate cron expression components
//   if (isNaN(scheduledTime.minute()) || isNaN(scheduledTime.hour()) || isNaN(scheduledTime.date()) || isNaN(scheduledTime.month())) {
//     console.error('Invalid cron expression generated');
//     return;
//   }

//   // Get the booking document from the database
//   const booking = await Booking.findById(bookingId);

//   if (!booking) {
//     console.error('Booking not found');
//     return;
//   }

//   // If a cron job already exists, cancel it before creating a new one
//   if (booking.cronJobId) {
//     console.log(`Cancelling previous cron job for Booking ID: ${bookingId}`);
//     // Use cronJobId to cancel the previous job (if you store cronJobId as a unique ID or key)
//     cron.getJobs().forEach((job) => {
//       if (job.name === booking.cronJobId) {
//         job.stop();  // Stop the previous job
//         console.log(`Previous cron job cancelled for Booking ID: ${bookingId}`);
//       }
//     });
//   }

//   // Schedule the new cron job
//   const cronJob = cron.schedule(cronExpression, async () => {
//     try {
//       console.log(`Cron job running for Booking ID: ${bookingId}`);

//       const bookings = await Booking.findOne({
//         _id: bookingId,
//         paymentStatus: 'unpaid',
//         opentopaid: false,
//         status: { $in: ['cancelled', 'canceledbyvendor'] }, // Exclude cancelled bookings
//       });

//       if (bookings) {
//         console.log(`Booking not updated. Payment is now open.`);
//         return;
//       }

//       // Update the booking's opentopaid status to true
//       const updatedBooking = await Booking.findByIdAndUpdate(
//         bookingId,
//         { opentopaid: true },
//         { new: true }
//       );

//       const user = await Booking.findById(bookingId).populate('user', 'isLogin fcmtoken').populate('tour', 'title').select('user tour');
//       const notification = new Notification({
//         user: user.user._id,
//         tourid: user.tour,
//         title: 'Payment Open Now',
//         message: `Your payment for booking is now open. You can pay now for ${user.tour.title}.`,
//       });
//       await notification.save();
//       console.log("User", user);

//       if (user.user.isLogin && user.user.fcmtoken) {
//         const message = {
//           notification: {
//             title: 'Payment Open Now',
//             body: `Your payment for booking is now open. You can pay now for ${user.tour.title}.`,
//           },
//           token: user.user.fcmtoken,
//         };

//         // Send notification via FCM
//         await admin.messaging().send(message);
//       }

//       console.log(`Booking ${updatedBooking._id} payment is now open.`);
//     } catch (error) {
//       console.error('Error while running the cron job:', error);
//     }
//   });

//   // Save the cron job ID in the booking document
//   booking.cronJobId = cronJob.name;  // Save the cron job identifier
//   await booking.save();

//   console.log(`Cron job scheduled for Booking ID: ${bookingId} at ${cronExpression}`);
// };











