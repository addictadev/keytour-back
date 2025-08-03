const mongoose = require('mongoose');
const Tour = require('./ToursModel'); // Import the Tour model
const CustomError = require('../utils/customError');

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
      }, // Reference to the user who made the review
    tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true }, // Reference to the reviewed tour
    rating: { type: Number, required: true, min: 1, max: 5 }, // Rating between 1 and 5
    comment: { type: String, required: true }, // User's comment
    created_at: { type: Date, default: Date.now }
});
reviewSchema.index({ user: 1, tour: 1 });
reviewSchema.pre('save', async function (next) {
  const Booking = mongoose.model('Review'); // Access the model
  const existingBooking = await Booking.findOne({
    user: this.user,
    tour: this.tour,
  });
  if (existingBooking) {
    // If booking exists, throw an error or set a custom error message
    const error = new Error('you are already added review on this tour');
    error.status = 400; // Custom HTTP status code for client error
    return next(error);
  }

  next(); // Proceed with saving if no existing booking is found
});
reviewSchema.pre('save', async function (next) {
    const review = this;
    try {
        // Calculate the new average rating after this review is added
        const tour = await Tour.findById(review.tour);

        if (!tour) {
          throw  new CustomError('tour not found', 404);
        }
        const reviews = await mongoose.model('Review').find({ tour: review.tour });
        const totalReviews = reviews.length;
        const ratingSum = reviews.reduce((sum, rev) => sum + rev.rating, 0);
        const averageRating = (ratingSum + review.rating) / (totalReviews + 1);

        // Update the tour's average rating and rating count
        tour.ratings.average = averageRating;
        tour.ratings.count = totalReviews + 1;
        review.vendor = tour.vendor;
        await tour.save();
        next();
    } catch (err) {
        next(err);
    }
});
reviewSchema.pre('find', function(next) {
    this.populate({
        path: 'user',
        select: 'name phone email image'
      }).populate({
        path: 'vendor',
        select: 'name  email '
      }).populate({
        path: 'tour',
        select: 'brief  title'
      });
    next();
  })
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
