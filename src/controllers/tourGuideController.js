const TourGuideService = require('../services/tourGuideService');
const response = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

class TourGuideController {
    createTourGuide = catchAsync(async (req, res, next) => {
        const data = {
            image: req.files ? req.files.image[0].path.replace(/\\/g, '/') : null,
            questions: req.body.questions // Assuming an array of question IDs
        };

        const tourGuide = await TourGuideService.createTourGuide(data);
        response(res, 201, tourGuide, 'Tour guide created successfully');
    });

    updateTourGuide = catchAsync(async (req, res, next) => {
        const { id } = req.params;
        const data = {
            coverImage: req.file ? req.file.path.replace(/\\/g, '/') : req.body.coverImage,
            questions: req.body.questions
        };

        const updatedTourGuide = await TourGuideService.updateTourGuide(id, data);
        response(res, 200, updatedTourGuide, 'Tour guide updated successfully');
    });

    addQuestionToTourGuide = catchAsync(async (req, res, next) => {
        const { tourGuideId, questionId } = req.body;
        const updatedTourGuide = await TourGuideService.addQuestionToTourGuide(tourGuideId, questionId);
        response(res, 200, updatedTourGuide, 'Question added to tour guide successfully');
    });

    getTourGuide = catchAsync(async (req, res, next) => {
        const { id } = req.params;
        const tourGuide = await TourGuideService.getTourGuide(id);
        response(res, 200, tourGuide, 'Tour guide retrieved successfully');
    });

    getAllTourGuides = catchAsync(async (req, res, next) => {
        const tourGuides = await TourGuideService.getAllTourGuides();
        response(res, 200, tourGuides, 'Tour guides retrieved successfully');
    });
}

module.exports = new TourGuideController();
