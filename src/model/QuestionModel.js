const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: {
        en: { type: String, required: true },
        ar: { type: String, required: true }
    },
    answer: {
        en: { type: String, required: true },
        ar: { type: String, required: true }
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

questionSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
