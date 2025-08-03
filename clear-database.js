require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

/**
 * Database Cleaner Script
 * Clears all collections in the MongoDB database
 * 
 * Usage:
 * npm run clear:db              - Clear all collections with confirmation
 * npm run clear:db --force      - Clear all collections without confirmation  
 * npm run clear:db --collection CollectionName - Clear specific collection
 * npm run clear:db --list       - List all collections
 */

class DatabaseCleaner {
    constructor() {
        // Database connection string from your index.js
        this.connectionString = process.env.DB || "mongodb+srv://adalaapp:123456789ma@cluster0.a93vbj1.mongodb.net/keytour";
        this.collections = [
            'aboutusmodels',
            'adminmodels', 
            'adminnotificationmodels',
            'appsettingsmodels',
            'availabilitymodels',
            'blogmodels',
            'bookingmodels',
            'contactmodels',
            'destinationmodels',
            'faqmodels',
            'notificationmodels',
            'otpmodels',
            'permissionsmodels',
            'questionmodels',
            'reviewmodels',
            'rolemodels',
            'tourguidemodels',
            'toursmodels',
            'usermodels',
            'vendormodels',
            'vendornotificationmodels',
            'events' // from eventSchema.js
        ];
    }

    // Connect to MongoDB
    async connect() {
        try {
            await mongoose.connect('mongodb+srv://adalaapp:123456789ma@cluster0.a93vbj1.mongodb.net/keytour', {
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

    // Get all collections in the database
    async listCollections() {
        try {
            const db = mongoose.connection.db;
            const collections = await db.listCollections().toArray();
            return collections.map(collection => collection.name);
        } catch (error) {
            console.error('❌ Error listing collections:', error.message);
            return [];
        }
    }

    // Clear a specific collection
    async clearCollection(collectionName) {
        try {
            const db = mongoose.connection.db;
            const collection = db.collection(collectionName);
            
            // Get count before deletion
            const count = await collection.countDocuments();
            
            if (count === 0) {
                console.log(`📭 Collection '${collectionName}' is already empty`);
                return { success: true, deletedCount: 0 };
            }

            // Delete all documents
            const result = await collection.deleteMany({});
            console.log(`🗑️  Cleared collection '${collectionName}' - ${result.deletedCount} documents removed`);
            
            return { success: true, deletedCount: result.deletedCount };
        } catch (error) {
            console.error(`❌ Error clearing collection '${collectionName}':`, error.message);
            return { success: false, error: error.message };
        }
    }

    // Clear all collections
    async clearAllCollections() {
        console.log('🧹 Starting database cleanup...\n');
        
        const collections = await this.listCollections();
        
        if (collections.length === 0) {
            console.log('📭 No collections found in database');
            return;
        }

        console.log(`📊 Found ${collections.length} collections in database:`);
        collections.forEach(name => console.log(`   - ${name}`));
        console.log('');

        let totalDeleted = 0;
        let clearedCollections = 0;
        let failedCollections = [];

        for (const collectionName of collections) {
            const result = await this.clearCollection(collectionName);
            
            if (result.success) {
                totalDeleted += result.deletedCount;
                if (result.deletedCount > 0) {
                    clearedCollections++;
                }
            } else {
                failedCollections.push(collectionName);
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 DATABASE CLEANUP SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Collections: ${collections.length}`);
        console.log(`Collections Cleared: ${clearedCollections}`);
        console.log(`Total Documents Deleted: ${totalDeleted}`);
        console.log(`Failed Collections: ${failedCollections.length}`);
        
        if (failedCollections.length > 0) {
            console.log(`❌ Failed to clear: ${failedCollections.join(', ')}`);
        }
        
        if (totalDeleted > 0) {
            console.log('🎉 Database cleanup completed successfully!');
        } else {
            console.log('📭 Database was already empty');
        }
    }

    // Clear specific collection by name
    async clearSpecificCollection(collectionName) {
        console.log(`🎯 Clearing specific collection: ${collectionName}\n`);
        
        const collections = await this.listCollections();
        
        if (!collections.includes(collectionName)) {
            console.log(`❌ Collection '${collectionName}' not found in database`);
            console.log(`📋 Available collections: ${collections.join(', ')}`);
            return;
        }

        const result = await this.clearCollection(collectionName);
        
        if (result.success) {
            console.log(`✅ Successfully cleared collection '${collectionName}'`);
        } else {
            console.log(`❌ Failed to clear collection '${collectionName}': ${result.error}`);
        }
    }

    // Show database statistics
    async showDatabaseStats() {
        console.log('📊 DATABASE STATISTICS\n');
        
        const collections = await this.listCollections();
        
        if (collections.length === 0) {
            console.log('📭 No collections found in database');
            return;
        }

        let totalDocuments = 0;
        console.log('Collection Statistics:');
        console.log('─'.repeat(40));
        
        for (const collectionName of collections) {
            try {
                const db = mongoose.connection.db;
                const collection = db.collection(collectionName);
                const count = await collection.countDocuments();
                totalDocuments += count;
                console.log(`${collectionName.padEnd(25)} : ${count} documents`);
            } catch (error) {
                console.log(`${collectionName.padEnd(25)} : Error reading`);
            }
        }
        
        console.log('─'.repeat(40));
        console.log(`Total Collections: ${collections.length}`);
        console.log(`Total Documents: ${totalDocuments}`);
    }

    // Prompt for user confirmation
    async getUserConfirmation(message) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            rl.question(message, (answer) => {
                rl.close();
                resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
            });
        });
    }

    // Main execution method
    async run() {
        const args = process.argv.slice(2);
        
        // Parse command line arguments
        const isForced = args.includes('--force');
        const listOnly = args.includes('--list');
        const statsOnly = args.includes('--stats');
        const collectionIndex = args.indexOf('--collection');
        const specificCollection = collectionIndex !== -1 ? args[collectionIndex + 1] : null;

        // Show help
        if (args.includes('--help') || args.includes('-h')) {
            this.showHelp();
            return;
        }

        // Connect to database
        const connected = await this.connect();
        if (!connected) {
            console.log('❌ Cannot proceed without database connection');
            process.exit(1);
        }

        try {
            // List collections only
            if (listOnly) {
                const collections = await this.listCollections();
                console.log('📋 Available Collections:');
                collections.forEach(name => console.log(`   - ${name}`));
                console.log(`\nTotal: ${collections.length} collections`);
                return;
            }

            // Show stats only
            if (statsOnly) {
                await this.showDatabaseStats();
                return;
            }

            // Clear specific collection
            if (specificCollection) {
                if (!isForced) {
                    const confirmed = await this.getUserConfirmation(
                        `⚠️  Are you sure you want to clear collection '${specificCollection}'? This action cannot be undone! (yes/no): `
                    );
                    if (!confirmed) {
                        console.log('❌ Operation cancelled by user');
                        return;
                    }
                }
                await this.clearSpecificCollection(specificCollection);
                return;
            }

            // Clear all collections
            if (!isForced) {
                console.log('⚠️  WARNING: This will permanently delete ALL data from your MongoDB database!');
                console.log('⚠️  This action cannot be undone!');
                console.log('⚠️  Database:', this.connectionString.split('@')[1]); // Hide credentials
                console.log('');
                
                const confirmed = await this.getUserConfirmation(
                    'Are you absolutely sure you want to proceed? Type "yes" to confirm: '
                );
                
                if (!confirmed) {
                    console.log('❌ Operation cancelled by user');
                    return;
                }
                
                // Double confirmation for extra safety
                const doubleConfirmed = await this.getUserConfirmation(
                    '🚨 FINAL CONFIRMATION: Type "DELETE ALL DATA" to proceed: '
                );
                
                if (!doubleConfirmed || args[0] !== 'DELETE ALL DATA') {
                    console.log('❌ Operation cancelled - confirmation not received');
                    return;
                }
            }

            // Proceed with clearing all collections
            await this.clearAllCollections();

        } finally {
            await this.disconnect();
        }
    }

    // Show help information
    showHelp() {
        console.log('🗑️  MongoDB Database Cleaner');
        console.log('');
        console.log('Usage:');
        console.log('  npm run clear:db                     - Clear all collections (with confirmation)');
        console.log('  npm run clear:db --force             - Clear all collections (no confirmation)');
        console.log('  npm run clear:db --collection <name> - Clear specific collection');
        console.log('  npm run clear:db --list              - List all collections');
        console.log('  npm run clear:db --stats             - Show database statistics');
        console.log('  npm run clear:db --help              - Show this help');
        console.log('');
        console.log('Examples:');
        console.log('  npm run clear:db --collection usermodels');
        console.log('  npm run clear:db --collection bookingmodels --force');
        console.log('');
        console.log('⚠️  WARNING: This tool permanently deletes data. Use with caution!');
    }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.log('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
    console.log('\n❌ Operation interrupted by user');
    await mongoose.disconnect();
    process.exit(0);
});

// Main execution
async function main() {
    const cleaner = new DatabaseCleaner();
    await cleaner.run();
}

// Run the script
main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});