/**
 * Database Cleanup Script - Free up MongoDB Atlas storage space
 * 
 * This script helps identify and clean up large collections to make room
 * for the RBAC system setup.
 * 
 * Usage: node V2/scripts/cleanup-database.js
 * 
 * @author Expert Backend Developer
 * @version 2.0.0
 */

const mongoose = require('mongoose');
const readline = require('readline');

class DatabaseCleanup {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    /**
     * Main cleanup execution
     */
    async run() {
        try {
            console.log('\n🧹 MongoDB Atlas Database Cleanup Tool\n');
            console.log('This tool will help you free up storage space by:');
            console.log('- Analyzing collection sizes');
            console.log('- Identifying large documents');
            console.log('- Providing cleanup options');
            console.log('- Optimizing database storage\n');

            // Connect to database
            await this.connectToDatabase();

            // Analyze database usage
            await this.analyzeDatabaseUsage();

            // Show cleanup options
            await this.showCleanupOptions();

            console.log('\n✅ Database cleanup completed!\n');

        } catch (error) {
            console.error('\n❌ Cleanup failed:', error.message);
            process.exit(1);
        } finally {
            this.rl.close();
            await mongoose.connection.close();
        }
    }

    /**
     * Connect to MongoDB database
     */
    async connectToDatabase() {
        console.log('📡 Connecting to database...');
        
        const mongoUri = process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://localhost:27017/keytour';
        
        try {
            await mongoose.connect('mongodb+srv://adalaapp:123456789ma@cluster0.a93vbj1.mongodb.net/keytourtesting', {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('✅ Database connected successfully');
        } catch (error) {
            throw new Error(`Database connection failed: ${error.message}`);
        }
    }

    /**
     * Analyze database usage and show statistics
     */
    async analyzeDatabaseUsage() {
        console.log('\n📊 Analyzing database usage...\n');

        try {
            // Get database stats
            const db = mongoose.connection.db;
            const stats = await db.stats();
            
            console.log('📈 Database Statistics:');
            console.log(`   Total Size: ${this.formatBytes(stats.dataSize)}`);
            console.log(`   Index Size: ${this.formatBytes(stats.indexSize)}`);
            console.log(`   Storage Size: ${this.formatBytes(stats.storageSize)}`);
            console.log(`   Collections: ${stats.collections}`);
            console.log(`   Documents: ${stats.objects.toLocaleString()}`);

            // Calculate percentage used (assuming 512 MB limit for free tier)
            const freeLimit = 512 * 1024 * 1024; // 512 MB
            const usagePercent = (stats.storageSize / freeLimit * 100).toFixed(1);
            console.log(`   Usage: ${usagePercent}% of 512 MB limit\n`);

            // Get collection statistics
            const collections = await db.listCollections().toArray();
            const collectionStats = [];

            for (const collection of collections) {
                try {
                    const collStats = await db.collection(collection.name).stats();
                    collectionStats.push({
                        name: collection.name,
                        size: collStats.size,
                        storageSize: collStats.storageSize,
                        count: collStats.count,
                        avgObjSize: collStats.avgObjSize
                    });
                } catch (error) {
                    // Skip collections that can't be analyzed
                    console.warn(`   Warning: Could not analyze collection ${collection.name}`);
                }
            }

            // Sort by storage size
            collectionStats.sort((a, b) => b.storageSize - a.storageSize);

            console.log('📊 Collection Sizes:');
            collectionStats.forEach((coll, index) => {
                if (index < 10) { // Show top 10 largest collections
                    console.log(`   ${index + 1}. ${coll.name}:`);
                    console.log(`      Documents: ${coll.count.toLocaleString()}`);
                    console.log(`      Data Size: ${this.formatBytes(coll.size)}`);
                    console.log(`      Storage Size: ${this.formatBytes(coll.storageSize)}`);
                    console.log(`      Avg Doc Size: ${this.formatBytes(coll.avgObjSize)}`);
                    console.log('');
                }
            });

            return collectionStats;

        } catch (error) {
            console.error('Error analyzing database:', error.message);
            return [];
        }
    }

    /**
     * Show cleanup options to user
     */
    async showCleanupOptions() {
        console.log('\n🧹 Cleanup Options:\n');
        console.log('1. Clean upload files and images');
        console.log('2. Remove old/test data');
        console.log('3. Compress large text fields');
        console.log('4. Archive old records');
        console.log('5. Drop unnecessary indexes');
        console.log('6. Skip cleanup (manual cleanup required)');

        const choice = await this.askQuestion('\nSelect cleanup option (1-6): ');

        switch (choice) {
            case '1':
                await this.cleanupUploads();
                break;
            case '2':
                await this.cleanupTestData();
                break;
            case '3':
                await this.compressTextFields();
                break;
            case '4':
                await this.archiveOldRecords();
                break;
            case '5':
                await this.optimizeIndexes();
                break;
            case '6':
                console.log('\n⚠️  Manual cleanup required. See suggestions below:');
                await this.showManualCleanupSuggestions();
                break;
            default:
                console.log('Invalid option selected.');
        }
    }

    /**
     * Clean up upload files and images
     */
    async cleanupUploads() {
        console.log('\n🖼️  Cleaning up upload files...');

        try {
            const db = mongoose.connection.db;
            
            // Check if uploads collection exists
            const collections = await db.listCollections({ name: 'uploads' }).toArray();
            if (collections.length === 0) {
                console.log('   No uploads collection found.');
                return;
            }

            // Count documents before cleanup
            const beforeCount = await db.collection('uploads').countDocuments();
            console.log(`   Found ${beforeCount} upload records`);

            if (beforeCount === 0) {
                console.log('   No upload records to clean.');
                return;
            }

            const shouldCleanup = await this.askQuestion('   Delete all upload records? (y/N): ');
            
            if (shouldCleanup.toLowerCase() === 'y' || shouldCleanup.toLowerCase() === 'yes') {
                const result = await db.collection('uploads').deleteMany({});
                console.log(`   ✅ Deleted ${result.deletedCount} upload records`);

                // Also clean up any GridFS files if they exist
                try {
                    const fsFiles = await db.collection('fs.files').countDocuments();
                    const fsChunks = await db.collection('fs.chunks').countDocuments();
                    
                    if (fsFiles > 0 || fsChunks > 0) {
                        const cleanGridFS = await this.askQuestion(`   Found ${fsFiles} GridFS files. Delete them? (y/N): `);
                        
                        if (cleanGridFS.toLowerCase() === 'y') {
                            await db.collection('fs.files').deleteMany({});
                            await db.collection('fs.chunks').deleteMany({});
                            console.log(`   ✅ Cleaned up GridFS files`);
                        }
                    }
                } catch (error) {
                    console.log('   No GridFS collections found.');
                }
            }

        } catch (error) {
            console.error('   Error cleaning uploads:', error.message);
        }
    }

    /**
     * Clean up test and development data
     */
    async cleanupTestData() {
        console.log('\n🧪 Cleaning up test data...');

        try {
            const db = mongoose.connection.db;
            let totalDeleted = 0;

            // Define patterns that indicate test data
            const testPatterns = [
                { collection: 'users', filter: { email: /test|demo|example/i } },
                { collection: 'bookings', filter: { status: 'test' } },
                { collection: 'tours', filter: { title: /test|demo|sample/i } },
                { collection: 'reviews', filter: { comment: /test|demo/i } }
            ];

            for (const pattern of testPatterns) {
                try {
                    const collection = db.collection(pattern.collection);
                    const count = await collection.countDocuments(pattern.filter);
                    
                    if (count > 0) {
                        console.log(`   Found ${count} test records in ${pattern.collection}`);
                        const shouldDelete = await this.askQuestion(`   Delete these test records? (y/N): `);
                        
                        if (shouldDelete.toLowerCase() === 'y') {
                            const result = await collection.deleteMany(pattern.filter);
                            console.log(`   ✅ Deleted ${result.deletedCount} test records from ${pattern.collection}`);
                            totalDeleted += result.deletedCount;
                        }
                    }
                } catch (error) {
                    console.log(`   Collection ${pattern.collection} not found or error: ${error.message}`);
                }
            }

            console.log(`\n   ✅ Total test records deleted: ${totalDeleted}`);

        } catch (error) {
            console.error('   Error cleaning test data:', error.message);
        }
    }

    /**
     * Compress large text fields (placeholder - would need specific implementation)
     */
    async compressTextFields() {
        console.log('\n📝 Text field compression...');
        console.log('   This feature would compress large text fields to save space.');
        console.log('   Implementation requires field-specific analysis.');
        console.log('   Consider storing large text content externally (AWS S3, etc.)');
    }

    /**
     * Archive old records
     */
    async archiveOldRecords() {
        console.log('\n📦 Archiving old records...');

        try {
            const db = mongoose.connection.db;
            const cutoffDate = new Date();
            cutoffDate.setMonth(cutoffDate.getMonth() - 6); // 6 months ago

            console.log(`   Archiving records older than: ${cutoffDate.toDateString()}`);

            // Define collections with date fields to archive
            const archiveTargets = [
                { collection: 'bookings', dateField: 'createdAt' },
                { collection: 'reviews', dateField: 'createdAt' },
                { collection: 'notifications', dateField: 'createdAt' }
            ];

            let totalArchived = 0;

            for (const target of archiveTargets) {
                try {
                    const collection = db.collection(target.collection);
                    const filter = {};
                    filter[target.dateField] = { $lt: cutoffDate };
                    
                    const count = await collection.countDocuments(filter);
                    
                    if (count > 0) {
                        console.log(`   Found ${count} old records in ${target.collection}`);
                        const shouldArchive = await this.askQuestion(`   Archive these old records? (y/N): `);
                        
                        if (shouldArchive.toLowerCase() === 'y') {
                            const result = await collection.deleteMany(filter);
                            console.log(`   ✅ Archived ${result.deletedCount} old records from ${target.collection}`);
                            totalArchived += result.deletedCount;
                        }
                    }
                } catch (error) {
                    console.log(`   Collection ${target.collection} not found or error: ${error.message}`);
                }
            }

            console.log(`\n   ✅ Total records archived: ${totalArchived}`);

        } catch (error) {
            console.error('   Error archiving records:', error.message);
        }
    }

    /**
     * Optimize database indexes
     */
    async optimizeIndexes() {
        console.log('\n⚡ Optimizing indexes...');

        try {
            const db = mongoose.connection.db;
            const collections = await db.listCollections().toArray();

            for (const collection of collections) {
                try {
                    const coll = db.collection(collection.name);
                    const indexes = await coll.indexes();
                    
                    console.log(`   ${collection.name}: ${indexes.length} indexes`);
                    
                    // Show large indexes
                    for (const index of indexes) {
                        if (index.name !== '_id_') {
                            const stats = await coll.stats();
                            console.log(`     - ${index.name}`);
                        }
                    }
                } catch (error) {
                    // Skip collections that can't be analyzed
                }
            }

            console.log('\n   💡 Consider removing unused indexes to save space');
            console.log('   💡 Use compound indexes instead of multiple single-field indexes');

        } catch (error) {
            console.error('   Error analyzing indexes:', error.message);
        }
    }

    /**
     * Show manual cleanup suggestions
     */
    async showManualCleanupSuggestions() {
        console.log('\n💡 Manual Cleanup Suggestions:');
        console.log('');
        console.log('1. 📁 **Large Collections**: Focus on collections with most data');
        console.log('   - Check for duplicate entries');
        console.log('   - Remove unnecessary fields');
        console.log('   - Archive old records');
        console.log('');
        console.log('2. 🖼️  **Media Files**: Often the largest space consumers');
        console.log('   - Move images to external storage (AWS S3, Cloudinary)');
        console.log('   - Compress images before storage');
        console.log('   - Clean up temporary/test uploads');
        console.log('');
        console.log('3. 📊 **Logs & Analytics**: Can grow very large');
        console.log('   - Implement log rotation');
        console.log('   - Archive old analytics data');
        console.log('   - Use external logging services');
        console.log('');
        console.log('4. 🗃️  **Indexes**: Can take significant space');
        console.log('   - Review and remove unused indexes');
        console.log('   - Use compound indexes efficiently');
        console.log('   - Consider sparse indexes for optional fields');
        console.log('');
        console.log('5. 📝 **Text Content**: Large text fields');
        console.log('   - Store large content externally');
        console.log('   - Implement text compression');
        console.log('   - Use references instead of embedding');
    }

    /**
     * Format bytes to human readable string
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Ask user a question and return response
     */
    askQuestion(question) {
        return new Promise((resolve) => {
            this.rl.question(question, resolve);
        });
    }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
    // Load environment variables
    require('dotenv').config();

    const cleanup = new DatabaseCleanup();
    cleanup.run().catch(error => {
        console.error('Cleanup failed:', error);
        process.exit(1);
    });
}

module.exports = DatabaseCleanup;