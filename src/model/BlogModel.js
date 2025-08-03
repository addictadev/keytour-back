const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: {
        en: { type: String, required: true },
        ar: { type: String, required: true }
    },
    description: {
        en: { type: String, required: true },
        ar: { type: String, required: true }
    },
    image: { type: String, required: true }, // Path to the main image
    imagesthubnails: [{ type: String, required: true }], // Array of thumbnail images
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

blogSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
