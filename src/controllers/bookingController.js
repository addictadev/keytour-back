const BookingService = require('../services/bookingService');
const response = require('../utils/response');
const catchAsync = require('../utils/catchAsync');
const factort = require('../utils/apiFactory');
const Booking = require('../model/BookingModel');


class BookingController {

  async cancelBookingController(req, res) {
    try {
      const cancellerUser = req.user;
      const { bookingId } = req.body; 

      const cancelledBooking = await BookingService.cancelBooking(bookingId, cancellerUser);
  
      response(res, 200, cancelledBooking, 'Booking cancelled successfully');

    } catch (error) {
      res.status(error.statusCode || 500).json({
        message: error.message,
      });
    }
  }





    getallbooking = catchAsync(async (req, res, next) => { 

        // Check if the user is a vendor and set the query's vendor to the user's ID
if (req.user.defaultrole === "vendor") { req.query.vendor = req.user._id; }            
        // Step 3: Fetch the bookings using the BookingService
        const result = await BookingService.getAllBookings(req.query);
    
        // Step 5: Return the response with pending and accepted counts
        response(res, 200, result.data, 'Bookings retrieved successfully', {
            results: result.results,
            pendingCount: result.pendingCount,   // Include pending count in the response
            acceptedCount: result.acceptedCount  // Include accepted count in the response
        });
    });
    













     getBookingById = catchAsync(async (req, res, next) => {
        console.log(req.params);
      
        const booking = await Booking.findById(req.params.id)
          .populate('user')
     
      
        if (!booking) {
          return next(new AppError('No booking found with that ID', 404));
        }
      
 
      
        res.status(200).json({
          status: 'success',
          data: {
            data: booking,
          },
        });
      });
      







    
    // Create a new booking
    createBooking = catchAsync(async (req, res, next) => {





        const booking = await BookingService.createBooking(req.body);
        response(res, 201, booking, 'Booking created successfully');
    });
    // getallbooking = factort.getAll(Booking)
    // Process payment for a booking
    processPayment = catchAsync(async (req, res, next) => {
        const booking = await BookingService.processPayment(req.params.id, req.body);
        response(res, 200, booking, 'Payment processed successfully');
    });

    // Cancel a booking
    cancelBooking = catchAsync(async (req, res, next) => {
        const cancellerUser = req.user;
        const booking = await BookingService.cancelBooking(req.params.id, cancellerUser);
        response(res, 200, booking, 'Booking canceled successfully');
    });
    deleteBooking = catchAsync(async (req, res, next) => {
      const booking = await BookingService.delete(req.params.id);
      response(res, 204, booking, 'Booking deleted successfully');
  });
  deletemanyBooking = catchAsync(async (req, res, next) => {
    const booking = await BookingService.deleteManya();
    response(res, 204, booking, 'Booking many deleted successfully');
});

    updateBooking = catchAsync(async (req, res, next) => {
        const { id } = req.params;
        const booking = await BookingService.updateBooking(id, req.body, req.user);
        response(res, 200, booking, 'Booking updated successfully');
    });
}

module.exports = new BookingController();
