const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema({
    privacyPolicy: {
        en: { type: String, required: true }, // Privacy Policy in English
        ar: { type: String, required: true }  // Privacy Policy in Arabic
    },
    socialMediaLinks: {
        facebook: { type: String, required: false },
        twitter: { type: String, required: false },
        instagram: { type: String, required: false },
        linkedin: { type: String, required: false }
    },
    phoneNumbers: [{
        label: { type: String }, // Label for the phone number (e.g., "Customer Support")
        number: { type: String  } // Phone number
    }],
    address: {
        title: { type: String  }, // Address title (e.g., "Headquarters")
        latitude: { type: Number}, // Latitude of the location
        longitude: { type: Number }, // Longitude of the location
    },
    email: { type: String }, // Contact email
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

appSettingsSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

const AppSettings = mongoose.model('AppSettings', appSettingsSchema);

module.exports = AppSettings;
