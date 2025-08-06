const mongoose = require('mongoose');

const otpAttemptSchema = new mongoose.Schema({
    identifier: { 
        type: String, // Can be email, userId, or IP
        required: true,
        index: true 
    },
    identifierType: {
        type: String,
        enum: ['email', 'userId', 'ip', 'deviceFingerprint'],
        required: true
    },
    attempts: [{
        otp: String,
        timestamp: { type: Date, default: Date.now },
        success: { type: Boolean, default: false },
        reason: String, // e.g., 'invalid', 'expired', 'success'
        deviceInfo: {
            ip: String,
            userAgent: String,
            deviceFingerprint: String
        }
    }],
    // Rate limiting
    totalAttempts: { 
        type: Number, 
        default: 0 
    },
    successfulAttempts: { 
        type: Number, 
        default: 0 
    },
    failedAttempts: { 
        type: Number, 
        default: 0 
    },
    // Blocking mechanism
    isBlocked: { 
        type: Boolean, 
        default: false 
    },
    blockedUntil: Date,
    blockReason: String,
    // Last activity tracking
    lastAttemptAt: Date,
    lastSuccessAt: Date,
    // Window tracking for rate limiting
    windowStart: { 
        type: Date, 
        default: Date.now 
    },
    windowAttempts: { 
        type: Number, 
        default: 0 
    },
    created_at: { 
        type: Date, 
        default: Date.now 
    },
    updated_at: { 
        type: Date, 
        default: Date.now 
    }
});

// Indexes for performance
otpAttemptSchema.index({ identifier: 1, identifierType: 1 });
otpAttemptSchema.index({ lastAttemptAt: -1 });
otpAttemptSchema.index({ blockedUntil: 1 });

// Update timestamp on save
otpAttemptSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

// Instance methods
otpAttemptSchema.methods.recordAttempt = function(otp, success, reason, deviceInfo) {
    const now = new Date();
    
    // Reset window if it's been more than 15 minutes
    const windowDuration = 15 * 60 * 1000; // 15 minutes
    if (now - this.windowStart > windowDuration) {
        this.windowStart = now;
        this.windowAttempts = 0;
    }
    
    // Record the attempt
    this.attempts.push({
        otp: otp ? otp.substring(0, 3) + '***' : null, // Store partial OTP for security
        timestamp: now,
        success,
        reason,
        deviceInfo
    });
    
    // Keep only last 50 attempts to prevent bloat
    if (this.attempts.length > 50) {
        this.attempts = this.attempts.slice(-50);
    }
    
    // Update counters
    this.totalAttempts++;
    this.windowAttempts++;
    this.lastAttemptAt = now;
    
    if (success) {
        this.successfulAttempts++;
        this.lastSuccessAt = now;
        this.failedAttempts = 0; // Reset consecutive failures
        this.windowAttempts = 0; // Reset window on success
    } else {
        this.failedAttempts++;
    }
    
    // Check if should be blocked
    this.checkAndApplyBlocking();
    
    return this.save();
};

otpAttemptSchema.methods.checkAndApplyBlocking = function() {
    const MAX_ATTEMPTS_PER_WINDOW = 3;
    const MAX_CONSECUTIVE_FAILURES = 5;
    const BLOCK_DURATION_MINUTES = [5, 15, 60, 240]; // Progressive blocking
    
    // Check window attempts
    if (this.windowAttempts > MAX_ATTEMPTS_PER_WINDOW) {
        this.applyBlock('Too many attempts in short time');
        return;
    }
    
    // Check consecutive failures
    if (this.failedAttempts >= MAX_CONSECUTIVE_FAILURES) {
        this.applyBlock('Too many consecutive failed attempts');
        return;
    }
};

otpAttemptSchema.methods.applyBlock = function(reason) {
    // Determine block duration based on previous blocks
    const blockCount = this.attempts.filter(a => a.reason === 'blocked').length;
    const blockIndex = Math.min(blockCount, 3); // Max index 3
    const blockMinutes = [5, 15, 60, 240][blockIndex]; // Progressive delays
    
    this.isBlocked = true;
    this.blockedUntil = new Date(Date.now() + blockMinutes * 60 * 1000);
    this.blockReason = reason;
};

otpAttemptSchema.methods.isCurrentlyBlocked = function() {
    if (!this.isBlocked) return false;
    
    const now = new Date();
    if (this.blockedUntil && now < this.blockedUntil) {
        return true;
    }
    
    // Unblock if time has passed
    this.isBlocked = false;
    this.blockedUntil = null;
    this.blockReason = null;
    return false;
};

otpAttemptSchema.methods.getBlockedTimeRemaining = function() {
    if (!this.isCurrentlyBlocked()) return 0;
    
    const now = new Date();
    const remaining = this.blockedUntil - now;
    return Math.ceil(remaining / 1000); // Return seconds
};

otpAttemptSchema.methods.canRequestOTP = function() {
    // Check if blocked
    if (this.isCurrentlyBlocked()) {
        return {
            allowed: false,
            reason: 'Account temporarily blocked',
            waitTime: this.getBlockedTimeRemaining()
        };
    }
    
    // Check cooldown between requests (30 seconds)
    const COOLDOWN_SECONDS = 30;
    const now = new Date();
    const timeSinceLastAttempt = (now - this.lastAttemptAt) / 1000;
    
    if (timeSinceLastAttempt < COOLDOWN_SECONDS) {
        return {
            allowed: false,
            reason: 'Please wait before requesting another OTP',
            waitTime: Math.ceil(COOLDOWN_SECONDS - timeSinceLastAttempt)
        };
    }
    
    return { allowed: true };
};

// Static methods
otpAttemptSchema.statics.findOrCreateByIdentifier = async function(identifier, identifierType) {
    let attemptRecord = await this.findOne({ identifier, identifierType });
    
    if (!attemptRecord) {
        attemptRecord = new this({ identifier, identifierType });
        await attemptRecord.save();
    }
    
    return attemptRecord;
};

otpAttemptSchema.statics.cleanupOldRecords = async function() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    return await this.deleteMany({
        lastAttemptAt: { $lt: thirtyDaysAgo }
    });
};

const OTPAttempt = mongoose.model('OTPAttempt', otpAttemptSchema);

module.exports = OTPAttempt;