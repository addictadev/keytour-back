/**
 * Staff Model - Enhanced admin model for RBAC system
 * 
 * Features:
 * - Comprehensive staff information
 * - Role-based access control
 * - Account status management
 * - Audit trail support
 * - Token management integration
 * 
 * @author Expert Backend Developer
 * @version 2.0.0
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffSchema = new mongoose.Schema({
    // Basic Information
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false // Don't include password in queries by default
    },
    
    // Contact Information
    phone: {
        type: String,
        trim: true,
        match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    },
    
    // Role-Based Access Control (Multiple Roles Support)
    roles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role'
    }],
    
    // Primary role for backward compatibility and default permissions
    primaryRole: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: [true, 'Primary role is required']
    },
    
    // Department/Team Assignment
    department: {
        type: String,
        enum: ['IT', 'Marketing', 'Sales', 'Customer Support', 'Content', 'Finance', 'HR', 'Operations'],
        required: [true, 'Department is required']
    },
    
    // Employment Information
    employeeId: {
        type: String,
        unique: true,
        required: [true, 'Employee ID is required']
    },
    position: {
        type: String,
        required: [true, 'Position is required'],
        trim: true
    },
    hireDate: {
        type: Date,
        default: Date.now
    },
    
    // Account Status
    isActive: {
        type: Boolean,
        default: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    
    // Security & Access Control
    lastLogin: {
        type: Date
    },
    lastPasswordChange: {
        type: Date,
        default: Date.now
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    
    // Two-Factor Authentication
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        type: String,
        select: false
    },
    
    // Profile & Preferences
    avatar: {
        type: String, // URL to profile image
        default: null
    },
    timezone: {
        type: String,
        default: 'UTC'
    },
    language: {
        type: String,
        default: 'en',
        enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ar']
    },
    
    // Audit Trail
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for performance optimization
staffSchema.index({ email: 1 });
staffSchema.index({ employeeId: 1 });
staffSchema.index({ primaryRole: 1 });
staffSchema.index({ roles: 1 });
staffSchema.index({ department: 1 });
staffSchema.index({ isActive: 1, isBlocked: 1 });

// Virtual for full name
staffSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for account locked status
staffSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware for password hashing
staffSchema.pre('save', async function(next) {
    // Only hash password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        // Hash password with cost of 12
        this.password = await bcrypt.hash(this.password, 12);
        next();
    } catch (error) {
        next(error);
    }
});

// Pre-save middleware for updating timestamps
staffSchema.pre('save', function(next) {
    if (!this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

// Method to check password
staffSchema.methods.checkPassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Method to increment failed login attempts
staffSchema.methods.incLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: {
                lockUntil: 1
            },
            $set: {
                failedLoginAttempts: 1
            }
        });
    }
    
    const updates = { $inc: { failedLoginAttempts: 1 } };
    
    // If we're not locked and our failed attempts is about to cross the threshold, lock account
    const maxAttempts = 5;
    const lockTime = 2 * 60 * 60 * 1000; // 2 hours
    
    if (this.failedLoginAttempts + 1 >= maxAttempts && !this.isLocked) {
        updates.$set = {
            lockUntil: Date.now() + lockTime
        };
    }
    
    return this.updateOne(updates);
};

// Method to reset login attempts
staffSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: {
            failedLoginAttempts: 1,
            lockUntil: 1
        },
        $set: {
            lastLogin: Date.now()
        }
    });
};

// Static method to find by email (case-insensitive)
staffSchema.statics.findByEmail = function(email) {
    return this.findOne({ 
        email: email.toLowerCase() 
    }).populate('role');
};

// Static method to find active staff
staffSchema.statics.findActive = function() {
    return this.find({ 
        isActive: true, 
        isBlocked: false 
    }).populate('role');
};

// Transform output (remove sensitive fields)
staffSchema.methods.toJSON = function() {
    const staff = this.toObject();
    delete staff.password;
    delete staff.twoFactorSecret;
    delete staff.__v;
    return staff;
};

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;