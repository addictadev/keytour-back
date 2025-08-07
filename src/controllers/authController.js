const AuthService = require("../services/authService");
const response = require("../utils/response");
const OTP = require("../model/OTPModel");
const vendorService = require("../services/vendorService");
const bcrypt = require("bcryptjs");
const User = require("../model/UserModel");
const emailService = require("../utils/emailService");

class AuthController {
  async register(req, res, next) {
    try {
      const user = await AuthService.register(req.body, req);

      console.log(user, "userrrrrrr");

      // Send OTP via email (already sent in service)
      const success = true; // Assume success since it's already sent in service

      user.password = undefined;

      let message = "User registered successfully.";
      if (success) {
        message += " Please check your email for OTP verification. OTP will expire in 5 minutes.";
      } else {
        message += " OTP generation successful but email delivery failed. Please use resend OTP option.";
      }

      response(res, 201, user, message);
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password, fcmtoken } = req.body;
      const role = req.headers["role"]; // Extract the role from the header
      let user, token;

      if (role === "vendor") {
        // Vendor login
        ({ user, token } = await vendorService.loginVendor(email, password, fcmtoken));
      } else if (role === "admin") {
        ({ user, token } = await vendorService.loginAdmin(email, password, fcmtoken));
      } else if (!role) {
        // Regular user login
        const loginResult = await AuthService.login(email, password, fcmtoken, req, res);
        
        // Check if this is a suspicious login that requires OTP
        if (loginResult.suspiciousLogin) {
          return response(res, 200, loginResult.otpData, loginResult.otpData.message);
        }
        
        ({ user, token } = loginResult);
        console.log(user, "user-user");
      }

      // Set the cookie with the token
      // res.cookie('token', token, {
      //     httpOnly: true,
      //     secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
      //     sameSite: 'strict',
      //     maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      // });

      // Hide the password in the response
      user.password = undefined;

      response(res, 200, { user, token }, "Login successful");
    } catch (err) {
      next(err);
    }
  }

  // AuthController.js

  async logout(req, res, next) {
    try {
      // Extract user ID from the request body (or from the token if you are using it)
      const userId = req.user.id; // Assuming the user ID is available in `req.user` from JWT middleware
      console.log(req.user);
      // Find the user by ID and update their `isLogin` status to `false`
      await User.findByIdAndUpdate(userId, { isLogin: false }, { new: true });

      // Clear the cookie by setting the token to an empty value and expiration to 0
      res.cookie("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Only HTTPS in production
        sameSite: "strict",
        expires: new Date(0), // Immediately expire the cookie
      });

      // Send response confirming logout
      response(res, 200, null, "Logout successful");
    } catch (err) {
      next(err);
    }
  }

  // async  logout(req, res, next) {
  //     try {
  //         // Clear the cookie by setting the token to an empty value and expiration to 0
  //         res.cookie('token', '', {
  //             httpOnly: true,
  //             secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
  //             sameSite: 'strict',
  //             expires: new Date(0) // Immediately expire the cookie
  //         });

  //         // Send response confirming logout
  //         response(res, 200, null, 'Logout successful');
  //     } catch (err) {
  //         next(err);
  //     }
  // }

  async verifyOTP(req, res, next) {
    try {
      const { userId, otp } = req.body;
      const role = req.headers["role"];
      
      let user;
      if (role === "admin") {
        user = await AuthService.verifyOTPAdmin(userId, otp, req);
      } else if (role === "vendor") {
        user = await AuthService.verifyOTPVendor(userId, otp, req);
      } else {
        user = await AuthService.verifyOTP(userId, otp, req);
      }
      
      response(res, 200, user, "OTP verified successfully");
    } catch (err) {
      next(err);
    }
  }

  async resendOTP(req, res, next) {
    try {
      const { userId } = req.body;
      const { otp, email } = await AuthService.resendOTP(userId, req);

      // Send new OTP via email (already sent in service)
      const success = true;

      let message = success
        ? "OTP resent successfully. Please check your email."
        : "OTP generated but email delivery failed. Please try again.";

      response(res, 200, null, message);
    } catch (err) {
      next(err);
    }
  }

  //   async forgetPassword(req, res, next) {
  //     try {

  //         const role = req.headers["role"];

  //       const { email } = req.body;
  //       if (role === "admin") {

  //           const { otp, user } = await AuthService.forgetPasswordadmin(email);

  //       }else{

  //           const { otp, user } = await AuthService.forgetPassword(email);
  //       }

  //       // Send OTP via email
  //       const success = await emailService.sendOTPEmail(email, otp);

  //       let message = success
  //         ? 'OTP sent to your email for password reset'
  //         : 'OTP generated but email delivery failed. Please try again.';

  //       response(
  //         res,
  //         200,
  //         { user: { _id: user._id, phone: user.phone, isVerified: user.isVerified } },
  //         message
  //       );
  //     } catch (err) {
  //       next(err);
  //     }
  //   }

  async forgetPassword(req, res, next) {
    try {
      const role = req.headers["role"];
      const { email } = req.body;

      let otp, user; // Declare otp and user at the top to ensure they are available in all scopes

      console.log(otp);

      // Declare otp and user at the top to ensure they are available in all scopes

      if (role === "admin") {
        // Ensure both otp and user are returned from the service
        const result = await AuthService.forgetPasswordadmin(email, req);
        otp = result.otp;
        user = result.user;
      } else if (role === "vendor") {
        // Ensure both otp and user are returned from the service
        const result = await AuthService.forgetPasswordVendor(email, req);
        otp = result.otp;
        user = result.user;

        console.log(otp, "otp-vendor");
      } else {
        // Ensure both otp and user are returned from the service
        const result = await AuthService.forgetPassword(email, req);
        otp = result.otp;
        user = result.user;
      }

      // Ensure otp and user are not undefined or null before proceeding
      if (!otp || !user) {
        throw new Error("Failed to generate OTP or user details");
      }

      // Send OTP via email (already sent in service)
      const success = true;

      let message = success
        ? "OTP sent to your email for password reset"
        : "OTP generated but email delivery failed. Please try again.";

      response(res, 200, { user: { _id: user._id, phone: user.phone, isVerified: user.isVerified, otp: otp } }, message);
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { email, newPassword, otp } = req.body;
      const role = req.headers["role"];

      let user;
      if (role === "admin") {
        await AuthService.verifyOTPAdmin(email, otp, req);
        user = await AuthService.resetPasswordAdmin(email, newPassword);
      } else if (role === "vendor") {
        await AuthService.verifyOTPVendor(email, otp, req);
        user = await AuthService.resetPasswordVendor(email, newPassword);
      } else {
        await AuthService.verifyOTP(email, otp, req);
        user = await AuthService.resetPassword(email, newPassword);
      }

      response(res, 200, user, "Password reset successfully");
    } catch (err) {
      next(err);
    }
  }

  async verifyLoginOTP(req, res, next) {
    try {
      const { userId, otp, fcmtoken } = req.body;
      const role = req.headers["role"];

      let result;
      if (role === "vendor") {
        result = await vendorService.verifyLoginOTP(userId, otp, fcmtoken, req);
      } else if (role === "admin") {
        result = await vendorService.verifyAdminLoginOTP(userId, otp, fcmtoken, req);
      } else {
        result = await AuthService.verifyLoginOTP(userId, otp, fcmtoken, req);
      }

      response(res, 200, result, "Login successful");
    } catch (err) {
      next(err);
    }
  }

  // Implement Google, Facebook, Apple login controllers
}

module.exports = new AuthController();
