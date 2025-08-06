const User = require("../model/UserModel");
const OTPService = require("./otpService");
const bcrypt = require("bcryptjs");
const jwt = require("../utils/jwt");
const CustomError = require("../utils/customError");
const OTP = require("../model/OTPModel");
const response = require("../utils/response");
const Admin = require("../model/AdminModel");
const Vendor = require("../model/VendorModel");
const deviceDetector = require("../utils/deviceDetector");
const emailService = require("../utils/emailService");

class AuthService {
  async register(data, req) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = new User({ ...data, password: hashedPassword });
    await user.save();

    // Extract device info from request
    const deviceInfo = deviceDetector.extractDeviceInfo(req);

    // Generate and send OTP via email
    const otpResult = await OTPService.generateOTP(user._id, 'user', 'verification', deviceInfo);
console.log(otpResult);
    // Return full user object for backward compatibility
    const userObj = user.toObject();
    delete userObj.password;
    userObj.otp = otpResult.otp; // Include OTP for backward compatibility in dev
    userObj.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    return userObj;
  }
  async login(email, password, fcmtoken, req, res) {
    // Find the user by email
    const user = await User.findOne({ email });
    
    // Check if the user exists and if the password is correct
    if (user?.isBlocked) throw new CustomError("User is blocked. Please contact support.", 403);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new CustomError("Invalid email or password", 401);
    }

    // Extract device info
    const deviceInfo = deviceDetector.extractDeviceInfo(req);

    // Check if the user is verified
    if (!user.isVerified) {
      const otpResult = await OTPService.generateOTP(user._id, 'user', 'verification', deviceInfo);
      return response(
        res,
        200,
        { 
          user: { 
            _id: user._id, 
            phone: user.phone, 
            isVerified: user.isVerified,
            otp: "success sended" 
          }
        },
        `User Not Verified The New OTP Sended To : ${user?.phone} And Will Expired Within 5 Min`
      );
    }

    // Check for suspicious login
    const { isSuspicious, isNewDevice } = await OTPService.checkSuspiciousLogin(
      user._id, 
      'user', 
      deviceInfo
    );

    if (isSuspicious) {
      // Generate OTP for suspicious login
      const otpResult = await OTPService.generateOTP(
        user._id, 
        'user', 
        'suspicious_login', 
        deviceInfo
      );
      
      // Return response similar to unverified user for consistency
      return response(
        res,
        200,
        { 
          user: { 
            _id: user._id, 
            phone: user.phone, 
            isVerified: user.isVerified,
            otp: otpResult.otp,
            requiresOTP: true,
            reason: isNewDevice ? 'new_device' : 'unusual_activity'
          }
        },
        isNewDevice 
          ? `New device detected. OTP sent to your email (${otpResult.email})`
          : `Unusual activity detected. OTP sent to your email (${otpResult.email})`
      );
    }

    // Update the user's login status and FCM token
    user.isLogin = true;
    user.fcmtoken = fcmtoken;

    // Save the user with updated login status and FCM token
    await user.save({ validateBeforeSave: false });

    // Create JWT token for the session
    const token = jwt.createToken(user);

    return { user, token };
  }

  async verifyOTP(userId, otp, req) {
    // Find user by email or ID
    let user;
    if (userId.includes('@')) {
      user = await User.findOne({ email: userId });
    } else {
      user = await User.findById(userId);
    }
    
    if (!user) {
      throw new CustomError("User not found", 404);
    }

    // Extract device info
    const deviceInfo = deviceDetector.extractDeviceInfo(req);

    // Verify OTP with device info
    const isValid = await OTPService.verifyOTP(user._id, otp, 'user', deviceInfo);
    
    if (isValid) {
      // Update user verification status
      user = await User.findByIdAndUpdate(
        user._id, 
        { isVerified: true },
        { new: true }
      );
    }

    return user;
  }
  async verifyOTPAdmin(userId, otp, req) {
    const user = await Admin.findOne({ email: userId });
    if (!user) {
      throw new CustomError("Admin not found", 404);
    }

    const deviceInfo = deviceDetector.extractDeviceInfo(req);
    await OTPService.verifyOTP(user._id, otp, 'admin', deviceInfo);

    return user;
  }
  async verifyOTPVendor(userId, otp, req) {
    const user = await Vendor.findOne({ email: userId });
    if (!user) {
      throw new CustomError("Vendor not found", 404);
    }

    const deviceInfo = deviceDetector.extractDeviceInfo(req);
    await OTPService.verifyOTP(user._id, otp, 'vendor', deviceInfo);

    return user;
  }
  async resendOTP(userId, req, purpose = 'verification') {
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError("User not found", 404);
    }

    const deviceInfo = deviceDetector.extractDeviceInfo(req);
    const otpResult = await OTPService.resendOTP(user._id, 'user', purpose, deviceInfo);

    return {
      otp: otpResult.otp, // For backward compatibility
      email: user.email
    };
  }

  async forgetPassword(email, req) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new CustomError("User not found with this email", 404);
    }

    const deviceInfo = deviceDetector.extractDeviceInfo(req);
    const otpResult = await OTPService.generateOTP(user._id, 'user', 'password_reset', deviceInfo);

    return { 
      otp: otpResult.otp, // For backward compatibility
      user: {
        _id: user._id,
        phone: user.phone,
        isVerified: user.isVerified
      }
    };
  }

  async forgetPasswordadmin(email, req) {
    const user = await Admin.findOne({ email });
    if (!user) {
      throw new CustomError("Admin not found with this email", 404);
    }

    const deviceInfo = deviceDetector.extractDeviceInfo(req);
    const otpResult = await OTPService.generateOTP(user._id, 'admin', 'password_reset', deviceInfo);

    user.otp = otpResult.otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    return { 
      otp: otpResult.otp, // For backward compatibility
      user: user
    };
  }
  async forgetPasswordVendor(email, req) {
    const user = await Vendor.findOne({ email });
    if (!user) {
      throw new CustomError("Vendor not found with this email", 404);
    }

    const deviceInfo = deviceDetector.extractDeviceInfo(req);
    const otpResult = await OTPService.generateOTP(user._id, 'vendor', 'password_reset', deviceInfo);

    user.otp = otpResult.otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    return { 
      otp: otpResult.otp, // For backward compatibility
      user: user
    };
  }
  async resetPassword(userId, newPassword) {
    console.log(userId, newPassword, "newPasswordddddd");
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await User.findOneAndUpdate({ email: userId }, { password: hashedPassword }, { new: true });
    console.log(user)
    return user;
  }
  async resetPasswordAdmin(userId, newPassword) {
    // const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await Admin.findOneAndUpdate({ email: userId }, { password: newPassword }, { new: true });
    return user;
  }
  async resetPasswordVendor(userId, newPassword) {
    // const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await Vendor.findOneAndUpdate({ email: userId }, { password: newPassword }, { new: true });
    return user;
  }

  async verifyLoginOTP(userId, otp, fcmtoken, req) {
    // Find user by ID or email
    let user;
    if (userId.includes('@')) {
      user = await User.findOne({ email: userId });
    } else {
      user = await User.findById(userId);
    }
    
    if (!user) {
      throw new CustomError("User not found", 404);
    }

    // Extract device info
    const deviceInfo = deviceDetector.extractDeviceInfo(req);

    // Verify OTP with device info
    const isValid = await OTPService.verifyOTP(user._id, otp, 'user', deviceInfo);
    
    if (!isValid) {
      throw new CustomError("Invalid OTP", 400);
    }

    // Update the user's login status and FCM token
    user.isLogin = true;
    user.fcmtoken = fcmtoken;
    await user.save({ validateBeforeSave: false });

    // Create JWT token for the session
    const token = jwt.createToken(user);

    // Hide password
    user.password = undefined;

    return { user, token };
  }

  // Implement Google, Facebook, Apple login methods
}

module.exports = new AuthService();
