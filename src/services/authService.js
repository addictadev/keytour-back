const User = require("../model/UserModel");
const OTPService = require("./otpService");
const bcrypt = require("bcryptjs");
const jwt = require("../utils/jwt");
const CustomError = require("../utils/customError");
const OTP = require("../model/OTPModel");
const response = require("../utils/response");
const Admin = require("../model/AdminModel");
const Vendor = require("../model/VendorModel");

class AuthService {
  async register(data) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    console.log(hashedPassword);
    const user = new User({ ...data, password: hashedPassword });
    await user.save();

    const otp = await OTPService.generateOTP(user._id);

    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    return user;
  }
  async login(email, password, fcmtoken, res) {
    // Find the user by email
    const user = await User.findOne({ email });
console.log("user", user)
    // Check if the user exists and if the password is correct
    if (user?.isBlocked) throw new CustomError("User is blocked. Please contact support.", 403);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new CustomError("Invalid email or password", 401);
    }

    // Check if the user is verified
    if (!user.isVerified) {
      const otp = await OTPService.generateOTP(user._id);
      return response(
        res,
        200,
        { user: { _id: user._id, phone: user.phone, isVerified: user.isVerified, otp: "success sended" } },
        `User Not Verified The New OTP Sended To : ${user?.phone} And Will Expired Within 5 Min`
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

  async verifyOTP(userId, otp) {
    let users;
    const user = await User.findOne({ email: userId }, { new: true });
   const a = await OTPService.verifyOTP(user?._id, otp);
   if(a) {
    users = await User.findByIdAndUpdate( user?._id , {isVerified:true},{ new: true });

   }

    return users;
  }
  async verifyOTPAdmin(userId, otp) {
    const user = await Admin.findOne({ email: userId }, { new: true });
    console.log(user?._id);
    await OTPService.verifyOTP(user?._id, otp);

    return user;
  }
  async verifyOTPVendor(userId, otp) {
    const user = await Vendor.findOne({ email: userId }, { new: true });
    await OTPService.verifyOTP(user?._id, otp);

    return user;
  }
  async resendOTP(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError("User not found", 404);
    }

    const otp = await OTPService.generateOTP(user._id);
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
    await user.save();

    return { otp, email: user.email };
  }

  async forgetPassword(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new CustomError("User not found with this email", 404);
    }

    const otp = await OTPService.generateOTP(user._id);
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    return { otp, user };
  }

  async forgetPasswordadmin(email) {
    const user = await Admin.findOne({ email });
    if (!user) {
      throw new CustomError("User not found with this email", 404);
    }

    const otp = await OTPService.generateOTP(user._id);
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    return { otp, user };
  }
  async forgetPasswordVendor(email) {
    const user = await Vendor.findOne({ email });
    if (!user) {
      throw new CustomError("User not found with this email", 404);
    }

    const otp = await OTPService.generateOTP(user._id);
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    return { otp, user };
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

  // Implement Google, Facebook, Apple login methods
}

module.exports = new AuthService();
