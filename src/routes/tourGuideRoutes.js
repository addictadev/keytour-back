const express = require('express');
const TourGuideController = require('../controllers/tourGuideController');
const uploadSingle = require('../middlewares/upload'); // Middleware for file uploads
const router = express.Router();

// Route to create a tour guide
router.post('/', uploadSingle, TourGuideController.createTourGuide);

// Route to update a tour guide
router.put('/:id', uploadSingle, TourGuideController.updateTourGuide);

// Route to add a question to a tour guide
router.post('/add-question', TourGuideController.addQuestionToTourGuide);

// Route to get a specific tour guide
router.get('/:id', TourGuideController.getTourGuide);

// Route to get all tour guides
router.get('/', TourGuideController.getAllTourGuides);

module.exports = router;
