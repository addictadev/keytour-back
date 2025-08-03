const express = require('express');
const TourController = require('../controllers/tourController');
const tourValidator = require('../validators/tourValidator');
const validateRequest = require('../middlewares/validateRequest');
const uploadFiles  = require('../middlewares/upload');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
router.patch('/cancel-tour', TourController.cancelTour);
router.patch('/fully-tour', TourController.fullcapacity);
router.get('/:tourId/bookings', TourController.getTourUserBookingInfo);
router.post('/',uploadFiles,authMiddleware('vendor'), TourController.createTour);
router.get('/:id', TourController.getTourById);
router.get('/', TourController.getAllTours);
router.post('/update-status', TourController.updateTourStatus);
router.patch('/resend-tour/:tourId', TourController.resendTourRequest);
router.put('/:id', uploadFiles, TourController.updateTour);
router.delete('/:id', TourController.deleteTour);

module.exports = router;
