const mongoose = require('mongoose');

const FAQSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, 'A question is required'],
        trim: true
    },
    answer: {
        type: String,
        required: [true, 'An answer is required'],
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('FAQ', FAQSchema);
