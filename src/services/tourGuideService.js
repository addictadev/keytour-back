const TourGuide = require('../model/TourGuideModel');

const CustomError = require('../utils/customError');

class TourGuideService {
    async createTourGuide(data) {
        const tourGuide = new TourGuide(data);
        await tourGuide.save();
        return tourGuide;
    }

    async updateTourGuide(id, data) {
        const tourGuide = await TourGuide.findByIdAndUpdate(id, data, { new: true }).populate('questions');
        if (!tourGuide) {
            throw new CustomError('Tour Guide not found', 404);
        }
        return tourGuide;
    }

    async addQuestionToTourGuide(tourGuideId, questionId) {
        const tourGuide = await TourGuide.findById(tourGuideId);
        if (!tourGuide) {
            throw new CustomError('Tour Guide not found', 404);
        }

        tourGuide.questions.push(questionId);
        await tourGuide.save();
        return tourGuide.populate('questions');
    }

    async getTourGuide(id) {
        const tourGuide = await TourGuide.findById(id).populate('questions');
        if (!tourGuide) {
            throw new CustomError('Tour Guide not found', 404);
        }
        return tourGuide;
    }

    async getAllTourGuides() {
        return await TourGuide.find().populate('questions');
    }
}

module.exports = new TourGuideService();
