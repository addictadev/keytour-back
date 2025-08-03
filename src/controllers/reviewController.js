const ReviewService = require('../services/reviewService');
const response = require('../utils/response');
const catchAsync = require('../utils/catchAsync');
const reviewService = require('../services/reviewService');
class ReviewController {
    async createReview(req, res, next) {
        try {
            const review = await ReviewService.createReview(req.body);
            response(res, 201, review, 'Review created successfully');
        } catch (err) {
            next(err);
        }
    }










    getallreviews = catchAsync(async (req, res, next) => { 

        if (req?.user?.defaultrole=="vendor") {
   
            req.query.vendor=req.user._id
       
         
            }
        // }

   


    
        // Step 3: Fetch the tours using Bookings
        const result = await reviewService.getAllreviwes(req.query);
    
  

    
        // Step 5: Return the response
        response(res, 200, result.data, 'reviews  retrieved successfully', {
            results: result.results,

        });
    });
















    updateReview = catchAsync(async (req, res, next) => {
        const review = await ReviewService.updateReview(req.params.id, req.body);
        response(res, 200, review, 'Review updated successfully');
    });








    async getReviewsByTourId(req, res, next) {
        try {
            const reviews = await ReviewService.getReviewsByTourId(req.params.tourId);
            response(res, 200, reviews, 'Reviews retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    async deleteReview(req, res, next) {
        try {
            await ReviewService.deleteReview(req.params.id);
            response(res, 200, null, 'Review deleted successfully');
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new ReviewController();
