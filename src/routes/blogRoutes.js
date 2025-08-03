const express = require('express');
const BlogController = require('../controllers/blogController');
const uploadFiles = require('../middlewares/upload');

const router = express.Router();

router
    .route('/')
    .post(uploadFiles, BlogController.createBlog)  // Create blog with images
    .get(BlogController.getAllBlogs);  // Get all blogs

router
    .route('/:id')
    .get(BlogController.getBlogById)  // Get blog by ID
    .patch(uploadFiles, BlogController.updateBlog)  // Update blog with images
    .delete(BlogController.deleteBlog);  // Delete blog by ID

module.exports = router;
