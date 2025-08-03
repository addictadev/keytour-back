const OTP = require("../model/OTPModel");
const crypto = require("crypto");
const User = require("../model/UserModel");
class OTPService {
  async generateOTP(userId) {
    const user = await User.findById(userId);

    // Generate a random 6-digit OTPP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + parseInt(process.env.OTP_EXPIRY) * 60000);

   const a= await OTP.create({ userId, otp, expiresAt });
console.log(a)
    return otp;
  }

  async verifyOTP(userId, otp) {
    const validOTP = await OTP.findOne({ userId, otp, expiresAt: { $gte: new Date() } });
 

    console.log(validOTP)
    console.log(userId)

    if (!validOTP) {
      throw new Error("Invalid or expired OTP");
    }
    await OTP.deleteOne({ _id: validOTP._id }); // OTP used, so remove it
    return true;
  }

  async deleteOTP(userId) {
    await OTP.deleteMany({ userId });
  }
}

module.exports = new OTPService();
