const Review = require('../model/ReviewModel');
const Tour = require('../model/ToursModel');
const APIFeatures = require('../utils/apiFeatures');

const CustomError = require('../utils/customError');

class ReviewService {
    async createReview(data) {
        const review = new Review(data);
        await review.save();

        // Update the tour's average rating and count
        const tour = await Tour.findById(data.tour);
        const reviews = await Review.find({ tour: data.tour });
        const totalReviews = reviews.length;
        const ratingSum = reviews.reduce((sum, rev) => sum + rev.rating, 0);
        tour.ratings.average = ratingSum / totalReviews;
        tour.ratings.count = totalReviews;
        await tour.save();

        return review;
    }






    async getAllreviwes(queryParams) {

        const filter = {};
        const features = new APIFeatures(Review.find(filter), queryParams)
            .filter()
            .sort()
            .limitFields()
            .paginate();
      

        const Reviews = await features.query;
   
        return {
            results: Reviews.length,
            data: Reviews
        };
    }











    async updateReview(id, data) {
        const review = await Review.findById(id);
        if (!review) throw new CustomError('Review not found', 404);

        // Update the review and save
        const oldRating = review.rating;
        review.set(data);
        await review.save();

        // Recalculate the tour's rating if the rating has changed
        if (oldRating !== review.rating) {
            const tour = await Tour.findById(review.tour);
            const reviews = await Review.find({ tour: review.tour });
            const ratingSum = reviews.reduce((sum, rev) => sum + rev.rating, 0);
            const averageRating = ratingSum / reviews.length;

            tour.ratings.average = averageRating;
            await tour.save();
        }

        return review;
    }

    async getReviewsByTourId(tourId) {
        return await Review.find({ tour: tourId }).populate('user', 'name');
    }

    async deleteReview(id) {
        const review = await Review.findByIdAndDelete(id);
        if (!review) {
            throw new CustomError('Review not found', 404);
        }

        // Update the tour's average rating and count after deletion
        const tour = await Tour.findById(review.tour);
        const reviews = await Review.find({ tour: review.tour });
        const totalReviews = reviews.length;
        const ratingSum = reviews.reduce((sum, rev) => sum + rev.rating, 0);
        tour.ratings.average = totalReviews ? ratingSum / totalReviews : 0;
        tour.ratings.count = totalReviews;
        await tour.save();

        return review;
    }
}

module.exports = new ReviewService();
