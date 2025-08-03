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
      const user = await AuthService.register(req.body);

      console.log(user, "userrrrrrr");

      // Send OTP via email
      const success = await emailService.sendOTPEmail(user.email, user.otp);

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
console.log(role)
      let user, token;

      if (role === "vendor") {
        // Vendor login
        ({ user, token } = await vendorService.loginVendor(email, password, fcmtoken));
      } else if (role === "admin") {
        ({ user, token } = await vendorService.loginAdmin(email, password, fcmtoken));
      } else if (!role) {
        // Regular user login
     
        ({ user, token } = await AuthService.login(email, password, fcmtoken, res));
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
      const user = await AuthService.verifyOTP(userId, otp);
      response(res, 200, user, "OTP verified successfully");
    } catch (err) {
      next(err);
    }
  }

  async resendOTP(req, res, next) {
    try {
      const { userId } = req.body;
      const { otp, email } = await AuthService.resendOTP(userId);

      // Send new OTP via email
      const success = await emailService.sendOTPEmail(email, otp);

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

      if (role === "admin") {
        // Ensure both otp and user are returned from the service
        const result = await AuthService.forgetPasswordadmin(email);
        otp = result.otp;
        user = result.user;
      } else if (role === "vendor") {
        // Ensure both otp and user are returned from the service
        const result = await AuthService.forgetPasswordVendor(email);
        otp = result.otp;
        user = result.user;

        console.log(otp, "otp-vendor");
      } else {
        // Ensure both otp and user are returned from the service
        const result = await AuthService.forgetPassword(email);
        otp = result.otp;
        user = result.user;
      }

      // Ensure otp and user are not undefined or null before proceeding
      if (!otp || !user) {
        throw new Error("Failed to generate OTP or user details");
      }

      // Send OTP via email
      const success = await emailService.sendOTPEmail(email, otp);

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
        await AuthService.verifyOTPAdmin(email, otp);
        user = await AuthService.resetPasswordAdmin(email, newPassword);
        // Verify OTP before allowing password reset
      } else if (role === "vendor") {
        await AuthService.verifyOTPVendor(email, otp); // Verify OTP before allowing password reset
        user = await AuthService.resetPasswordVendor(email, newPassword);
      } else {
        await AuthService.verifyOTP(email, otp);
        user = await AuthService.resetPassword(email, newPassword);
        // Verify OTP before allowing password reset
      }

      response(res, 200, user, "Password reset successfully");
    } catch (err) {
      next(err);
    }
  }

  // Implement Google, Facebook, Apple login controllers
}

module.exports = new AuthController();
