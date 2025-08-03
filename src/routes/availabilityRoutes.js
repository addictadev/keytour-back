const express = require('express');
const AvailabilityController = require('../controllers/availabilityController');
const validateAvailability = require('../validators/validateAvailability');

const router = express.Router();

router.post('/', AvailabilityController.createAvailability);
router.delete('/:id', AvailabilityController.deleteAvailabilityById);
router.get('/:id/tour/:tourId', AvailabilityController.getAvailabilityByIdAndTour);
// Route to delete all availability for a specific tour
router.delete('/tour/:tourId', AvailabilityController.deleteAvailabilityByTour);
module.exports = router;
