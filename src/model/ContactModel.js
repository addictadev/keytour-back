const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

contactSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
