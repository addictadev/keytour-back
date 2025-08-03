const express = require("express");
const AuthController = require("../controllers/authController");
const validateRequest = require("../middlewares/validateRequest");
const { registerValidator, loginValidator, otpValidator, resetPasswordValidator } = require("../validators/authValidator");
const authMiddleware = require("../middlewares/authMiddleware");
const googleAuthService = require("../services/googleAuthService");
const jwt = require("../utils/jwt");
const User = require("../model/UserModel");
const Vendor = require("../model/VendorModel");

const CustomError = require("../utils/customError");

const response = require("../utils/response");
const router = express.Router();
router.post("/google", async (req, res, next) => {
  try {
    console.log(req.headers.device == "web");
    console.log(req.headers);

    if (req.headers.device == "web") {
      const { idToken, fcmtoken } = req.body;
      const { user, token } = await googleAuthService.googleAuth(idToken, fcmtoken);

      // Set the cookie with the token
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Only HTTPS in production
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Hide the password in the response
      user.password = undefined;

      response(res, 200, { user, token }, "Login successful with Google");
    }
    if (req.headers.device == "moblie") {
      const { uid, email, name, picture, fcmtoken } = req.body;
      const { user, token } = await googleAuthService.googleAuthmobile(uid, email, name, picture, fcmtoken);

      // Set the cookie with the token
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Only HTTPS in production
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Hide the password in the response
      user.password = undefined;

      response(res, 200, { user, token }, "Login successful with Google");
    }
  } catch (error) {
    console.error("Error in Google login:", error);
    next(error);
  }
});
router.post("/register", registerValidator, validateRequest, AuthController.register);

router.put("/block/:userId", authMiddleware("admin"), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const role = req.headers["roling"];
    // Find the user by ID
    if (role === "vendor") {
      const user = await Vendor.findById(userId);
      if (!user) {
        throw new CustomError("User not found", 404);
      }
      user.isBlocked = !user.isBlocked; // Toggle the isBlocked statu
      await user.save({ validateBeforeSave: false });
      response(res, 200, user, "User blocked successfully");
    } else {
      const user = await User.findById(userId);
      if (!user) {
        throw new CustomError("User not found", 404);
      }

      user.isBlocked = !user.isBlocked; // Toggle the isBlocked statu
      await user.save({ validateBeforeSave: false });
      response(res, 200, user, "User blocked successfully");
    }

    // Respond with success message

    // Respond with success message
  } catch (err) {
    next(err);
  }
});

router.post("/logout", authMiddleware("user"), AuthController.logout);
router.post("/login", loginValidator, validateRequest, AuthController.login);
router.post("/verify-otp", otpValidator, validateRequest, AuthController.verifyOTP);
router.post("/resend-otp", otpValidator, validateRequest, AuthController.resendOTP);
router.post("/forget-password", AuthController.forgetPassword);
router.post("/reset-password", resetPasswordValidator, validateRequest, AuthController.resetPassword);

// Google, Facebook, Apple login routes (to be implemented)

module.exports = router;
