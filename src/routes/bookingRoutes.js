const express = require('express');
const BookingController = require('../controllers/bookingController');
const auth = require('../middlewares/authMiddleware');
const AuthMiddleware = require('../../V2/middleware/authMiddleware');
const PermissionMiddleware = require('../../V2/middleware/permissionMiddleware');

const router = express.Router();
// router.use(AuthMiddleware.requireAuth({
//     requireEmailVerification: false,
//     validateSession: true,
//     allowedUserTypes: ['staff']
// }));
router.post('/cancel-booking', auth('user','vendor','admin'), BookingController.cancelBookingController);
router
    .route('/').get(auth('vendor',"admin"),BookingController.getallbooking)
    .post(auth('user',"vendor"), BookingController.createBooking).delete(BookingController.deletemanyBooking);

router
    .route('/:id/pay')
    .post(BookingController.processPayment);

router
    .route('/:id/cancel')
    .post(auth('vendor', 'admin','user'), BookingController.cancelBooking);
    router
    .route('/:id')
    .get(BookingController.getBookingById)
    .delete(BookingController.deleteBooking)
    .patch(auth('vendor', 'admin'), BookingController.updateBooking);
 
module.exports = router;
