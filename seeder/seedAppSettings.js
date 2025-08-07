require('dotenv').config();
const mongoose = require('mongoose');
const AppSettings = require('../src/model/AppSettingsModel');

/**
 * App Settings Seeder
 * Populates the AppSettings collection with default data.
 * 
 * Usage:
 * npm run seed:settings
 */

class AppSettingsSeeder {
    constructor() {
        this.connectionString = 'mongodb+srv://adalaapp:123456789ma@cluster0.a93vbj1.mongodb.net/keytour';
        this.defaultSettings = {
            privacyPolicy: {
                en: "This is the default Privacy Policy in English. Please update it with your actual policy.",
                ar: "هذه هي سياسة الخصوصية الافتراضية باللغة العربية. يرجى تحديثها بسياستك الفعلية."
            },
            socialMediaLinks: {
                facebook: "https://www.facebook.com/keytour",
                twitter: "https://www.twitter.com/keytour",
                instagram: "https://www.instagram.com/keytour",
                linkedin: "https://www.linkedin.com/company/keytour"
            },
            phoneNumbers: [
                {
                    label: "Customer Support",
                    number: "+1 (800) 123-4567"
                },
                {
                    label: "Office",
                    number: "+1 (800) 765-4321"
                }
            ],
            address: {
                title: "KeyTour Headquarters",
                latitude: 34.052235,
                longitude: -118.243683,
            },
            email: "support@keytour.com"
        };
    }

    // Connect to MongoDB
    async connect() {
        try {
            await mongoose.connect(this.connectionString, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log('✅ Connected to MongoDB successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to connect to MongoDB:', error.message);
            return false;
        }
    }

    // Disconnect from MongoDB
    async disconnect() {
        try {
            await mongoose.disconnect();
            console.log('✅ Disconnected from MongoDB');
        } catch (error) {
            console.error('❌ Error disconnecting from MongoDB:', error.message);
        }
    }

    // Seed the AppSettings data
    async seed() {
        console.log('🌱 Starting AppSettings seeder...');

        const connected = await this.connect();
        if (!connected) {
            console.log('❌ Seeding cannot proceed without a database connection.');
            return;
        }

        try {
            // Check if settings already exist
            const existingSettings = await AppSettings.findOne();

            if (existingSettings) {
                console.log('🟡 App settings already exist. Overwriting with default data...');
                await AppSettings.deleteMany({});
            } else {
                console.log('🟢 No existing settings found. Creating new default settings...');
            }

            // Insert new settings
            const newSettings = new AppSettings(this.defaultSettings);
            await newSettings.save();

            console.log('🎉 App settings seeded successfully!');
            console.log(JSON.stringify(newSettings, null, 2));

        } catch (error) {
            console.error('❌ Error seeding app settings:', error.message);
        } finally {
            await this.disconnect();
        }
    }
}

// Run the seeder
const seeder = new AppSettingsSeeder();
seeder.seed().catch(error => {
    console.error('❌ Fatal error during seeding:', error);
    process.exit(1);
});