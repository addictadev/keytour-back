const express = require('express');
const AboutUsController = require('../controllers/aboutUsController');
const uploadSingle = require('../middlewares/upload'); // Assuming you have a middleware for single file upload

const router = express.Router();

router
    .route('/')
    .post(uploadSingle, AboutUsController.createAboutUs)  // Create About Us entry with an image
    .get(AboutUsController.getAllAboutUs);  // Get all About Us entries

router
    .route('/:id')
    .get(AboutUsController.getAboutUsById)  // Get About Us entry by ID
    .patch(uploadSingle, AboutUsController.updateAboutUs)  // Update About Us entry with an image
    .delete(AboutUsController.deleteAboutUs);  // Delete About Us entry by ID

module.exports = router;
