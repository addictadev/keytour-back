const UserService = require("../services/userService");
const response = require("../utils/response");
const catchAsync = require("../utils/catchAsync");
const User = require("../model/UserModel");

class UserController {
  // Toggle destination wishlist status
  toggleDestinationWishlist = catchAsync(async (req, res, next) => {
    // const userId = req.user._id; // Assuming user ID is available in the request after authentication
    const { destinationId, userId } = req.body;

    const updatedUser = await UserService.toggleDestinationWishlist(userId, destinationId);
    const isInWishlist = updatedUser.destinationwishlist.some((item) => item._id.toString() === destinationId);

    // Determine the appropriate message
    const message = isInWishlist
      ? "Destination added to wishlist successfully"
      : "Destination removed from wishlist successfully";
    response(res, 200, updatedUser, message);
  });

  // Toggle tour wishlist status
  toggleTourWishlist = catchAsync(async (req, res, next) => {
    // const userId = req.user._id; // Assuming user ID is available in the request after authentication
    const { tourId, userId } = req.body;

    const updatedUser = await UserService.toggleTourWishlist(userId, tourId);

    const isInWishlist = updatedUser.tourwishlist.some((item) => item._id.toString() === tourId);

    // Determine the appropriate message
    const message = isInWishlist ? "Tour added to wishlist successfully" : "Tour removed from wishlist successfully";

    response(res, 200, updatedUser, message);
  });

  // Update profile
  updateProfile = catchAsync(async (req, res, next) => {
    // const userId = req.user._id;
    const userId = req.params.id; // Assuming user ID is available in the request (e.g., after authentication)
    // Assuming user ID is available in the request (e.g., after authentication)
    let imagePath;
    if (req.files && req.files.image) {
      imagePath = req.files.image[0] ? req.files.image[0].path.replace(/\\/g, "/") : null; // Handle image path
    } else {
      imagePath = null; // Handle no image uploaded
    }
    const updatedUser = await UserService.updateUserProfile(userId, req.body, imagePath);
    response(res, 200, updatedUser, "Profile updated successfully");
  });
  // Delete user method
  deleteUser = catchAsync(async (req, res, next) => {
    const userId = req.params.id; // Get the user ID from request parameters

    // Delete the user from the database
    const user = await User.findByIdAndDelete(userId);

    // if (!user) {
    //   return next(new AppError('No user found with that ID', 404));
    // }

    // Respond with success
    response(res, 204, user, "User deleted successfully");
  });

  // Change password
  changePassword = catchAsync(async (req, res, next) => {
    const userId = req.params.id; // Assuming user ID is available in the request (e.g., after authentication)
    const { oldPassword, newPassword } = req.body;

    const updatedUser = await UserService.changeUserPassword(userId, oldPassword, newPassword);
    response(res, 200, updatedUser, "Password changed successfully");
  });

  // Get user by ID
  getUserProfile = catchAsync(async (req, res, next) => {
    const userId = req.params.id;
    const user = await UserService.getUserById(userId);
    response(res, 200, user, "User profile retrieved successfully");
  });

  getAllUsers = catchAsync(async (req, res, next) => {
    const result = await UserService.getAllUsers(req.query);

    response(res, 200, result.data, "users retrieved successfully", {
      results: result.results,
      counts: result.counts,
      pendingCount: result.pendingCount,
      acceptedCount: result.acceptedCount,
      // rejectedCount: result.rejectedCount,
    });
  });

  // Forgot password
  forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    const result = await UserService.forgotPassword(email);
    response(res, 200, result, "Password reset instructions sent to email");
  });
}

module.exports = new UserController();
