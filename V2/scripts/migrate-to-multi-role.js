/**
 * Migration Script: Single Role to Multi-Role System
 * 
 * This script migrates existing staff data from the old single-role system
 * to the new multi-role system with primaryRole and roles array.
 * 
 * Usage: node V2/scripts/migrate-to-multi-role.js
 * 
 * @author Expert Backend Developer
 * @version 2.0.0
 */

const mongoose = require('mongoose');
const readline = require('readline');

// Import models
const Staff = require('../models/StaffModel');
const Role = require('../../src/model/RoleModel');

class MultiRoleMigration {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    /**
     * Main migration execution
     */
    async run() {
        try {
            console.log('\n🔄 Multi-Role System Migration\n');
            console.log('This script will migrate your existing staff data from');
            console.log('the single-role system to the new multi-role system.\n');
            
            console.log('Migration Process:');
            console.log('1. Backup existing data');
            console.log('2. Analyze current staff records');
            console.log('3. Migrate role field to primaryRole and roles array');
            console.log('4. Validate migration');
            console.log('5. Clean up old role field\n');

            const shouldContinue = await this.askQuestion('Do you want to continue with migration? (y/N): ');
            if (shouldContinue.toLowerCase() !== 'y' && shouldContinue.toLowerCase() !== 'yes') {
                console.log('Migration cancelled.');
                process.exit(0);
            }

            // Connect to database
            await this.connectToDatabase();

            // Run migration steps
            await this.analyzeCurrentData();
            await this.createBackup();
            await this.performMigration();
            await this.validateMigration();
            await this.cleanupOldFields();

            console.log('\n✅ Multi-role migration completed successfully!\n');
            console.log('🎯 What changed:');
            console.log('   - Added primaryRole field for each staff');
            console.log('   - Added roles array with current role');
            console.log('   - Updated permission checking to use all roles');
            console.log('   - Preserved backward compatibility');

        } catch (error) {
            console.error('\n❌ Migration failed:', error.message);
            console.log('\n🔧 Troubleshooting:');
            console.log('   1. Check database connection');
            console.log('   2. Ensure no other processes are using the database');
            console.log('   3. Verify you have write permissions');
            console.log('   4. Check the backup was created successfully');
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
            await mongoose.connect(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('✅ Database connected successfully');
        } catch (error) {
            throw new Error(`Database connection failed: ${error.message}`);
        }
    }

    /**
     * Analyze current data structure
     */
    async analyzeCurrentData() {
        console.log('\n🔍 Analyzing current data structure...');

        try {
            // Check if migration is needed
            const sampleStaff = await Staff.findOne();
            
            if (!sampleStaff) {
                console.log('   No staff records found. Migration not needed.');
                process.exit(0);
            }

            // Check if already migrated
            if (sampleStaff.primaryRole && sampleStaff.roles) {
                console.log('   ✅ Data appears to already be migrated.');
                const shouldContinue = await this.askQuestion('   Continue anyway? (y/N): ');
                if (shouldContinue.toLowerCase() !== 'y') {
                    process.exit(0);
                }
            }

            // Count staff records
            const totalStaff = await Staff.countDocuments();
            const staffWithRoles = await Staff.countDocuments({ role: { $exists: true } });
            const staffWithoutRoles = totalStaff - staffWithRoles;

            console.log(`   📊 Analysis Results:`);
            console.log(`      Total staff records: ${totalStaff}`);
            console.log(`      Staff with roles: ${staffWithRoles}`);
            console.log(`      Staff without roles: ${staffWithoutRoles}`);

            if (staffWithoutRoles > 0) {
                console.log(`   ⚠️  Warning: ${staffWithoutRoles} staff records don't have roles assigned.`);
                console.log(`      These will be assigned a default role during migration.`);
            }

            // Check available roles
            const totalRoles = await Role.countDocuments();
            console.log(`      Available roles: ${totalRoles}`);

            if (totalRoles === 0) {
                throw new Error('No roles found in database. Please create roles first.');
            }

        } catch (error) {
            throw new Error(`Data analysis failed: ${error.message}`);
        }
    }

    /**
     * Create backup of current data
     */
    async createBackup() {
        console.log('\n💾 Creating backup...');

        try {
            const currentStaff = await Staff.find({}).populate('role');
            
            if (currentStaff.length === 0) {
                console.log('   No data to backup.');
                return;
            }

            // Create backup collection
            const backupCollectionName = `staff_backup_${Date.now()}`;
            const db = mongoose.connection.db;
            const backupCollection = db.collection(backupCollectionName);

            // Insert backup data
            await backupCollection.insertMany(currentStaff.map(staff => staff.toObject()));

            console.log(`   ✅ Backup created: ${backupCollectionName}`);
            console.log(`   📝 Backed up ${currentStaff.length} staff records`);

            this.backupCollectionName = backupCollectionName;

        } catch (error) {
            throw new Error(`Backup creation failed: ${error.message}`);
        }
    }

    /**
     * Perform the actual migration
     */
    async performMigration() {
        console.log('\n🔄 Performing migration...');

        try {
            const allStaff = await Staff.find({}).populate('role');
            const defaultRole = await Role.findOne();

            if (!defaultRole) {
                throw new Error('No default role available for staff without roles');
            }

            let migratedCount = 0;
            let errorCount = 0;

            for (const staff of allStaff) {
                try {
                    const currentRoleId = staff.role?._id || defaultRole._id;

                    // Set primaryRole and add to roles array
                    await Staff.findByIdAndUpdate(staff._id, {
                        $set: {
                            primaryRole: currentRoleId,
                            roles: [currentRoleId]
                        }
                    });

                    migratedCount++;
                    process.stdout.write(`\r   📊 Migrated: ${migratedCount}/${allStaff.length}`);

                } catch (error) {
                    errorCount++;
                    console.error(`\n   ❌ Error migrating staff ${staff.email}: ${error.message}`);
                }
            }

            console.log(`\n   ✅ Migration completed: ${migratedCount} successful, ${errorCount} errors`);

        } catch (error) {
            throw new Error(`Migration failed: ${error.message}`);
        }
    }

    /**
     * Validate the migration
     */
    async validateMigration() {
        console.log('\n🔍 Validating migration...');

        try {
            // Check that all staff have primaryRole and roles
            const totalStaff = await Staff.countDocuments();
            const staffWithPrimaryRole = await Staff.countDocuments({ 
                primaryRole: { $exists: true } 
            });
            const staffWithRoles = await Staff.countDocuments({ 
                roles: { $exists: true, $not: { $size: 0 } } 
            });

            console.log(`   📊 Validation Results:`);
            console.log(`      Total staff: ${totalStaff}`);
            console.log(`      Staff with primaryRole: ${staffWithPrimaryRole}`);
            console.log(`      Staff with roles array: ${staffWithRoles}`);

            if (staffWithPrimaryRole === totalStaff && staffWithRoles === totalStaff) {
                console.log('   ✅ Migration validation successful');
            } else {
                console.log('   ⚠️  Migration validation found issues');
                const shouldContinue = await this.askQuestion('   Continue anyway? (y/N): ');
                if (shouldContinue.toLowerCase() !== 'y') {
                    throw new Error('Migration validation failed');
                }
            }

            // Sample validation
            const sampleStaff = await Staff.findOne().populate(['primaryRole', 'roles']);
            if (sampleStaff) {
                console.log(`   📝 Sample record validation:`);
                console.log(`      Staff: ${sampleStaff.email}`);
                console.log(`      Primary Role: ${sampleStaff.primaryRole?.name || 'None'}`);
                console.log(`      Total Roles: ${sampleStaff.roles?.length || 0}`);
            }

        } catch (error) {
            throw new Error(`Validation failed: ${error.message}`);
        }
    }

    /**
     * Clean up old role field (optional)
     */
    async cleanupOldFields() {
        console.log('\n🧹 Cleaning up old fields...');

        const shouldCleanup = await this.askQuestion('Remove old "role" field? (y/N): ');
        
        if (shouldCleanup.toLowerCase() === 'y' || shouldCleanup.toLowerCase() === 'yes') {
            try {
                await Staff.updateMany({}, { $unset: { role: "" } });
                console.log('   ✅ Old "role" field removed from all staff records');
            } catch (error) {
                console.error('   ❌ Error removing old role field:', error.message);
                console.log('   💡 You can remove it manually later if needed');
            }
        } else {
            console.log('   ℹ️  Old "role" field preserved for backward compatibility');
        }
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

// Check if this script is being run directly
if (require.main === module) {
    // Load environment variables
    require('dotenv').config();

    const migration = new MultiRoleMigration();
    migration.run().catch(error => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
}

module.exports = MultiRoleMigration;