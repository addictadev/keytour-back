const AvailabilityService = require('../services/availabilityService');
const response = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

class AvailabilityController {
    createAvailability = catchAsync(async (req, res, next) => {
        const availability = await AvailabilityService.createAvailability(req.body);
        response(res, 201, availability, 'Availability created successfully');
    });
    deleteAvailabilityById = catchAsync(async (req, res, next) => {
        const result = await AvailabilityService.deleteAvailabilityById(req.params.id);
        response(res, 200, result, 'Availability deleted successfully');
    });

    // Delete all availability for a tour
    deleteAvailabilityByTour = catchAsync(async (req, res, next) => {
        const result = await AvailabilityService.deleteAvailabilityByTour(req.params.tourId);
        response(res, 200, result, 'All availability for the tour deleted successfully');
    });
    getAvailabilityByIdAndTour = catchAsync(async (req, res, next) => {
        const { id, tourId } = req.params; // Extract parameters from the request
        const availability = await AvailabilityService.getAvailabilityByIdAndTour(id, tourId);
        response(res, 200, availability, 'Availability retrieved successfully');
    });
}

module.exports = new AvailabilityController();
