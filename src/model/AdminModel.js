const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Hashed password for security
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        // required: true
    },
    defaultrole: {
        type: String,
        default:"admin"
    },
    isBlocked: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

adminSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
