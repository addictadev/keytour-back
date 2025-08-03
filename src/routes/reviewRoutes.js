const express = require('express');
const ReviewController = require('../controllers/reviewController');
const reviewValidator = require('../validators/reviewValidator');
const validateRequest = require('../middlewares/validateRequest');
const auth = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', reviewValidator, validateRequest, ReviewController.createReview);
router.get('/',auth('vendor',"admin"), ReviewController.getallreviews);

router.get('/tour/:tourId', ReviewController.getReviewsByTourId);
router.delete('/:id', ReviewController.deleteReview);
router
    .route('/:id')
    .put(ReviewController.updateReview)

module.exports = router;
