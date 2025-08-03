const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Hashed password for security
    company_name: { type: String, required: true },
    company_address: { type: String, required: true },
    image: { type: String, required: true },
    imagesthubnails:[{ type: String, required: true }],
    bank:{ type: String, required: true },
    bank_account:{ type: String, required: true },
    defaultrole: {
        type: String,
        default:"vendor"
    },
    
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    isBlocked: { type: Boolean, default: false },

    commission:{type:Number,default:15},
    phone: { type: String, required: true },
    tours: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tour' }], // References to the tours created by this vendor
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

vendorSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = Vendor;
