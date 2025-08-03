const mongoose = require('mongoose');

const aboutUsSchema = new mongoose.Schema({
    title: {
        en: { type: String, required: true },
        ar: { type: String },
    },
    description: {
        en: { type: String, required: true },
        ar: { type: String },
    },
    image: { type: String, required: true }, // Path to the image
    created_at: { type: Date, default: Date.now, },
    updated_at: { type: Date, default: Date.now }
});

aboutUsSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

const AboutUs = mongoose.model('AboutUs', aboutUsSchema);

module.exports = AboutUs;

