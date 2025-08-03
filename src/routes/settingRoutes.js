const express = require('express');
const ReviewController = require('../controllers/reviewController');
const reviewValidator = require('../validators/reviewValidator');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

router.post('/', reviewValidator, validateRequest, ReviewController.createReview);
router.get('/tour/:tourId', ReviewController.getReviewsByTourId);
router.delete('/:id', ReviewController.deleteReview);
router
    .route('/:id')
    .put(ReviewController.updateReview) // .delete(ReviewController.deleteReview);
module.exports = router;
