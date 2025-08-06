const OTP = require("../model/OTPModel");
const OTPAttempt = require("../model/OTPAttemptModel");
const DeviceTrust = require("../model/DeviceTrustModel");
const User = require("../model/UserModel");
const Admin = require("../model/AdminModel");
const Vendor = require("../model/VendorModel");
const emailService = require("../utils/emailService");
const crypto = require("crypto");
const CustomError = require("../utils/customError");

class OTPService {
  constructor() {
    this.OTP_LENGTH = 6;
    this.OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY) || 5;
    this.MAX_ACTIVE_OTPS = 1; // Only allow 1 active OTP at a time
  }

  // Generate device fingerprint from request headers
  generateDeviceFingerprint(deviceInfo) {
    const { userAgent = '', ip = '', browser = '', os = '' } = deviceInfo;
    const fingerprintData = `${userAgent}-${ip}-${browser}-${os}`;
    return crypto.createHash('sha256').update(fingerprintData).digest('hex');
  }

  // Get user by type and ID
  async getUserByTypeAndId(userId, userType) {
    let user;
    switch (userType) {
      case 'admin':
        user = await Admin.findById(userId);
        break;
      case 'vendor':
        user = await Vendor.findById(userId);
        break;
      default:
        user = await User.findById(userId);
    }
    return user;
  }

  // Check if login is from a suspicious device
  async checkSuspiciousLogin(userId, userType, deviceInfo) {
    const deviceFingerprint = this.generateDeviceFingerprint(deviceInfo);
    
    // Find trusted device
    const trustedDevice = await DeviceTrust.findTrustedDevice(userId, deviceFingerprint);
    
    if (!trustedDevice) {
      // Check if this is a completely new device or a previously seen one
      const existingDevice = await DeviceTrust.findOne({
        userId,
        deviceFingerprint
      });

      if (!existingDevice) {
        // New device - create record
        await DeviceTrust.create({
          userId,
          userType,
          deviceFingerprint,
          deviceInfo,
          trustLevel: 'suspicious'
        });
        return { isSuspicious: true, isNewDevice: true };
      } else if (existingDevice.trustLevel === 'blocked') {
        throw new CustomError('This device has been blocked. Please contact support.', 403);
      } else {
        // Known but not trusted device
        await existingDevice.updateActivity();
        return { isSuspicious: true, isNewDevice: false };
      }
    }

    // Update last used for trusted device
    await trustedDevice.updateActivity();
    return { isSuspicious: false, isNewDevice: false };
  }

  // Generate OTP with email delivery
  async generateOTP(userId, userType = 'user', purpose = 'verification', deviceInfo = {}) {
    const user = await this.getUserByTypeAndId(userId, userType);
    if (!user) {
      throw new CustomError("User not found", 404);
    }

    // Check rate limiting and attempts
    const attemptRecord = await OTPAttempt.findOrCreateByIdentifier(user.email, 'email');
    const canRequest = attemptRecord.canRequestOTP();
    
    if (!canRequest.allowed) {
      throw new CustomError(
        `${canRequest.reason}. Please wait ${canRequest.waitTime} seconds.`,
        429
      );
    }

    // Delete any existing active OTPs for this user
    await OTP.deleteMany({ userId });

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60000);

    // Create OTP record
    await OTP.create({ 
      userId, 
      otp, 
      expiresAt,
      purpose,
      deviceFingerprint: this.generateDeviceFingerprint(deviceInfo)
    });

    // Record the OTP request attempt
    await attemptRecord.recordAttempt(otp, true, 'generated', deviceInfo);

    // Send OTP via email based on purpose
    let emailSent = false;
    try {
      if (purpose === 'suspicious_login') {
        emailSent = await emailService.sendSuspiciousLoginOTP(
          user.email,
          otp,
          deviceInfo,
          this.OTP_EXPIRY_MINUTES
        );
      } else {
        emailSent = await emailService.sendOTPEmail(
          user.email,
          otp,
          this.OTP_EXPIRY_MINUTES
        );
      }
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Don't throw error, continue with OTP generation
    }

    return {
      otp: process.env.NODE_ENV !== 'development' ? otp : undefined, // Only return OTP in dev
      email: emailService.maskEmail(user.email),
      expiresIn: this.OTP_EXPIRY_MINUTES * 60, // seconds
      emailSent
    };
  }

  // Verify OTP with security checks
  async verifyOTP(userId, otp, userType = 'user', deviceInfo = {}) {
    const user = await this.getUserByTypeAndId(userId, userType);
    if (!user) {
      throw new CustomError("User not found", 404);
    }

    // Get attempt record
    const attemptRecord = await OTPAttempt.findOrCreateByIdentifier(user.email, 'email');
    
    // Check if blocked
    if (attemptRecord.isCurrentlyBlocked()) {
      const waitTime = attemptRecord.getBlockedTimeRemaining();
      throw new CustomError(
        `Too many failed attempts. Please wait ${waitTime} seconds.`,
        429
      );
    }

    // Find valid OTP
    const validOTP = await OTP.findOne({ 
      userId, 
      otp, 
      expiresAt: { $gte: new Date() } 
    });

    if (!validOTP) {
      // Record failed attempt
      await attemptRecord.recordAttempt(otp, false, 'invalid', deviceInfo);
      
      // Check if OTP exists but expired
      const expiredOTP = await OTP.findOne({ userId, otp });
      if (expiredOTP) {
        throw new CustomError("OTP has expired. Please request a new one.", 400);
      }
      
      throw new CustomError("Invalid OTP. Please try again.", 400);
    }

    // Record successful attempt
    await attemptRecord.recordAttempt(otp, true, 'verified', deviceInfo);

    // If this was for a suspicious login, mark device as trusted
    if (validOTP.purpose === 'suspicious_login' && deviceInfo) {
      const deviceFingerprint = this.generateDeviceFingerprint(deviceInfo);
      const device = await DeviceTrust.findOne({ userId, deviceFingerprint });
      
      if (device) {
        await device.markAsTrusted();
      }
    }

    // Delete used OTP
    await OTP.deleteOne({ _id: validOTP._id });

    return true;
  }

  // Resend OTP with rate limiting
  async resendOTP(userId, userType = 'user', purpose = 'verification', deviceInfo = {}) {
    const user = await this.getUserByTypeAndId(userId, userType);
    if (!user) {
      throw new CustomError("User not found", 404);
    }

    // Check if there's an active OTP
    const activeOTP = await OTP.findOne({
      userId,
      expiresAt: { $gte: new Date() }
    });

    if (activeOTP) {
      // Check if enough time has passed (30 seconds cooldown)
      const timeSinceCreated = (Date.now() - activeOTP.created_at) / 1000;
      if (timeSinceCreated < 30) {
        throw new CustomError(
          `Please wait ${Math.ceil(30 - timeSinceCreated)} seconds before requesting a new OTP.`,
          429
        );
      }
    }

    // Generate new OTP
    return await this.generateOTP(userId, userType, purpose, deviceInfo);
  }

  // Clean up expired OTPs (can be run as a cron job)
  async cleanupExpiredOTPs() {
    const result = await OTP.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    console.log(`Cleaned up ${result.deletedCount} expired OTPs`);
    return result.deletedCount;
  }

  // Get OTP status for debugging (admin only)
  async getOTPStatus(userId) {
    const activeOTPs = await OTP.find({ userId }).select('-otp');
    const attemptRecord = await OTPAttempt.findOne({ identifier: userId, identifierType: 'userId' });
    
    return {
      activeOTPs: activeOTPs.length,
      lastAttempt: attemptRecord?.lastAttemptAt,
      isBlocked: attemptRecord?.isCurrentlyBlocked() || false,
      totalAttempts: attemptRecord?.totalAttempts || 0,
      failedAttempts: attemptRecord?.failedAttempts || 0
    };
  }

  // Delete all OTPs for a user
  async deleteOTP(userId) {
    await OTP.deleteMany({ userId });
  }
}

module.exports = new OTPService();