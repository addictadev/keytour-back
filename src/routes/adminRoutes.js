const express = require('express');
const AdminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

// Only admins can create or view all admins
router
    .route('/')
    .post(AdminController.createAdmin) // Only 'admin' can create admins
    .get(authMiddleware('admin'), AdminController.getAllAdmins); // Only 'admin' can view all admins

// Admin-specific routes for retrieving, updating, or deleting an admin
router
    .route('/:id')
    .get(authMiddleware('admin'), AdminController.getAdminById) // Only 'admin' can view a specific admin
    .patch(authMiddleware('admin'), AdminController.updateAdmin) // Only 'admin' can update an admin
    .delete(authMiddleware('admin'), AdminController.deleteAdmin); // Only 'admin' can delete an admin

module.exports = router;
