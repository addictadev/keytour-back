/**
 * Add Destination Permissions to Existing RBAC System
 * 
 * This script adds destination permissions to an existing RBAC system
 * without disrupting the current production environment.
 * 
 * Usage: node V2/scripts/add-destination-permissions.js
 * 
 * @author Expert Backend Developer
 * @version 1.0.0
 */

const mongoose = require('mongoose');
const readline = require('readline');

// Import models
const Permission = require('../../src/model/PermissionsModel');
const Role = require('../../src/model/RoleModel');

class AddDestinationPermissions {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    /**
     * Main execution
     */
    async run() {
        try {
            console.log('\n🎯 Adding Destination Permissions to RBAC System\n');
            console.log('This script will:');
            console.log('1. Add destination permissions (create, read, update, delete)');
            console.log('2. Update existing roles with appropriate permissions');
            console.log('3. Maintain backward compatibility\n');

            const shouldContinue = await this.askQuestion('Continue? (y/N): ');
            if (shouldContinue.toLowerCase() !== 'y') {
                console.log('Cancelled.');
                process.exit(0);
            }

            // Connect to database
            await this.connectToDatabase();

            // Add permissions
            await this.addDestinationPermissions();

            // Update roles
            await this.updateRolesWithDestinationPermissions();

            console.log('\n✅ Destination permissions added successfully!\n');

        } catch (error) {
            console.error('\n❌ Error:', error.message);
            process.exit(1);
        } finally {
            this.rl.close();
            await mongoose.connection.close();
        }
    }

    /**
     * Connect to MongoDB
     */
    async connectToDatabase() {
        console.log('📡 Connecting to database...');
        
        const mongoUri = process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://localhost:27017/keytour';
        
        try {
            await mongoose.connect(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('✅ Connected successfully');
        } catch (error) {
            throw new Error(`Database connection failed: ${error.message}`);
        }
    }

    /**
     * Add destination permissions
     */
    async addDestinationPermissions() {
        console.log('\n🔐 Adding destination permissions...');

        const destinationPermissions = [
            { name: 'create:destinations', description: 'Create new destinations' },
            { name: 'read:destinations', description: 'View destination details' },
            { name: 'update:destinations', description: 'Update destination information' },
            { name: 'delete:destinations', description: 'Delete destinations' }
        ];

        let created = 0;
        let existing = 0;

        for (const permData of destinationPermissions) {
            try {
                const exists = await Permission.findOne({ name: permData.name });
                if (!exists) {
                    await Permission.create(permData);
                    console.log(`   ✅ Created: ${permData.name}`);
                    created++;
                } else {
                    console.log(`   ℹ️  Already exists: ${permData.name}`);
                    existing++;
                }
            } catch (error) {
                console.error(`   ❌ Error creating ${permData.name}: ${error.message}`);
            }
        }

        console.log(`\n   Summary: ${created} created, ${existing} already existed`);
    }

    /**
     * Update roles with destination permissions
     */
    async updateRolesWithDestinationPermissions() {
        console.log('\n👥 Updating roles with destination permissions...');

        // Get destination permission IDs
        const destPermissions = await Permission.find({
            name: { $in: ['create:destinations', 'read:destinations', 'update:destinations', 'delete:destinations'] }
        });

        const permissionMap = {};
        destPermissions.forEach(p => {
            permissionMap[p.name] = p._id;
        });

        // Define which roles get which permissions
        // NOTE: Only Admin and Super Admin can create/update/delete destinations
        const roleUpdates = [
            {
                roleName: 'Super Admin',
                permissions: ['create:destinations', 'read:destinations', 'update:destinations', 'delete:destinations']
            },
            {
                roleName: 'Admin',
                permissions: ['create:destinations', 'read:destinations', 'update:destinations', 'delete:destinations']
            },
            {
                roleName: 'Manager',
                permissions: ['read:destinations'] // Read-only access
            },
            {
                roleName: 'Content Manager',
                permissions: ['read:destinations'] // Read-only access
            },
            {
                roleName: 'Customer Support',
                permissions: ['read:destinations'] // Read-only access
            },
            {
                roleName: 'Vendor',
                permissions: ['read:destinations'] // Read-only access for vendors
            }
        ];

        for (const update of roleUpdates) {
            try {
                const role = await Role.findOne({ name: update.roleName });
                
                if (!role) {
                    console.log(`   ⚠️  Role not found: ${update.roleName}`);
                    continue;
                }

                // Get permission IDs to add
                const permissionIds = update.permissions
                    .map(name => permissionMap[name])
                    .filter(Boolean);

                // Add only new permissions (avoid duplicates)
                let added = 0;
                for (const permId of permissionIds) {
                    if (!role.permissions.includes(permId)) {
                        role.permissions.push(permId);
                        added++;
                    }
                }

                if (added > 0) {
                    await role.save();
                    console.log(`   ✅ Updated ${update.roleName}: Added ${added} destination permissions`);
                } else {
                    console.log(`   ℹ️  ${update.roleName}: Already has all destination permissions`);
                }

            } catch (error) {
                console.error(`   ❌ Error updating ${update.roleName}: ${error.message}`);
            }
        }
    }

    /**
     * Ask user a question
     */
    askQuestion(question) {
        return new Promise((resolve) => {
            this.rl.question(question, resolve);
        });
    }
}

// Run if executed directly
if (require.main === module) {
    require('dotenv').config();
    
    const script = new AddDestinationPermissions();
    script.run().catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    });
}

module.exports = AddDestinationPermissions;