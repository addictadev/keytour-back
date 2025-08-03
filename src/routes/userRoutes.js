const express = require("express");
const UserController = require("../controllers/userController");
const uploadSingle = require("../middlewares/upload"); // Middleware for file uploads
const router = express.Router();
// Toggle destination in wishlist
router.post("/wishlist/destination/toggle", UserController.toggleDestinationWishlist);

// Toggle tour in wishlist
router.post("/wishlist/tour/toggle", UserController.toggleTourWishlist);
// Route to update user profile
router.patch("/profile/:id", uploadSingle, UserController.updateProfile);
// Define the route for deleting users
router.delete("/deleteme/:id", UserController.deleteUser);

// Route to change password
router.post("/change-password/:id", UserController.changePassword);

// Route for forgot password
router.post("/forgot-password", UserController.forgotPassword);

// Route to get user profile
router.get("/profile/:id", UserController.getUserProfile);
router.get("/", UserController.getAllUsers);

module.exports = router;
