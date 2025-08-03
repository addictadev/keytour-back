const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Hashed password for security
    phone: { type: String},
    fcmtoken: { type: String },
  
    address: [{ type: String }],
    image: { type: String ,default:'https://i.pinimg.com/originals/b7/90/1e/b7901e00c054be87c92485fa29a46581.png'},
    bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }], // References to the bookings made by the user
    destinationwishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Destination' }], // References to the bookings made by the user
    tourwishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tour' }], // References to the bookings made by the user
    defaultrole: {
        type: String,
        default:"user"
    },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },

    isLogin: { type: Boolean, default: false }, // To check if the user has verified their email/phone
     // To check if the user has verified their email/phone
    provider: { type: String, enum: ['local', 'google', 'facebook', 'apple'], default: 'local' }, // Social login providers
    googleId: { type: String },
    facebookId: { type: String },
    appleId: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

userSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});
userSchema.pre(/^find/, function(next) {
    this.populate('bookings')
        .populate('destinationwishlist')
        .populate('tourwishlist');
    next();
});
const User = mongoose.model('User', userSchema);

module.exports = User;
