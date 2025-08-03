const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
    country: {
        en: { type: String, required: true },
        ar: { type: String, required: true }
    },
    city: {
        en: { type: String},
        ar: { type: String }
    },
    region: {
        en: { type: String},
        ar: { type: String }
    },
    description: {
        en: { type: String },
        ar: { type: String }
    },
    image:{
        type:String, required: true
    },
    rating:{
        type: Number, default: 4.5
    },

    wishlis: { type: Boolean, default: false, select: false },

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

destinationSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});










const Destination = mongoose.model('Destination', destinationSchema);

module.exports = Destination;
