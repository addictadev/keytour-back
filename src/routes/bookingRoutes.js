const express = require('express');
const BookingController = require('../controllers/bookingController');
const auth = require('../middlewares/authMiddleware');


const router = express.Router();

router.post('/cancel-booking', auth(), BookingController.cancelBookingController);
router
    .route('/').get(auth('vendor',"admin"),BookingController.getallbooking)
    .post(auth('user',"vendor"), BookingController.createBooking).delete(BookingController.deletemanyBooking);

router
    .route('/:id/pay')
    .post(BookingController.processPayment);

router
    .route('/:id/cancel')
    .post(auth('vendor', 'admin'), BookingController.cancelBooking);
    router
    .route('/:id')
    .get(BookingController.getBookingById)
    .delete(BookingController.deleteBooking)
    .patch(auth('vendor', 'admin'), BookingController.updateBooking);
 
module.exports = router;
