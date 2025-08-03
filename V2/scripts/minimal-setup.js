/**
 * Minimal RBAC Setup Script - Space-efficient initialization
 * 
 * This script creates only essential permissions and roles to minimize
 * database space usage for MongoDB Atlas free tier.
 * 
 * Usage: node V2/scripts/minimal-setup.js
 * 
 * @author Expert Backend Developer
 * @version 2.0.0
 */

const mongoose = require('mongoose');
const readline = require('readline');

// Import models and services
const Staff = require('../models/StaffModel');
const Role = require('../../src/model/RoleModel');
const Permission = require('../../src/model/PermissionsModel');

// Minimal setup configuration
const MINIMAL_CONFIG = {
    defaultSuperAdmin: {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@keytour.com',
        department: 'IT',
        employeeId: 'SUPER001',
        position: 'System Administrator'
    }
};

class MinimalSetup {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    /**
     * Main setup execution
     */
    async run() {
        try {
            console.log('\n🚀 KeyTour RBAC Minimal Setup\n');
            console.log('This script creates only essential data to save space:');
            console.log('- 5 core permissions (instead of 25)');
            console.log('- 2 essential roles (instead of 5)');
            console.log('- 1 super admin account');
            console.log('- Optimized for MongoDB Atlas free tier\n');

            // Check if setup should continue
            const shouldContinue = await this.askQuestion('Do you want to continue? (y/N): ');
            if (shouldContinue.toLowerCase() !== 'y' && shouldContinue.toLowerCase() !== 'yes') {
                console.log('Setup cancelled.');
                process.exit(0);
            }

            // Connect to database
            await this.connectToDatabase();

            // Run minimal setup steps
            await this.checkExistingData();
            await this.createMinimalPermissions();
            await this.createMinimalRoles();
            await this.createSuperAdminAccount();

            console.log('\n✅ Minimal RBAC setup completed successfully!\n');
            console.log('🎯 What was created:');
            console.log('   - Core permissions for basic functionality');
            console.log('   - Super Admin and Basic User roles');
            console.log('   - Super admin account ready to use');
            console.log('');
            console.log('📝 Next steps:');
            console.log('   1. Test login with super admin account');
            console.log('   2. Create additional permissions as needed');
            console.log('   3. Add more roles through the API');
            console.log('   4. Consider upgrading MongoDB Atlas for full setup\n');

        } catch (error) {
            console.error('\n❌ Setup failed:', error.message);
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
     * Check for existing data
     */
    async checkExistingData() {
        console.log('\n🔍 Checking existing data...');

        const [existingPermissions, existingRoles, existingStaff] = await Promise.all([
            Permission.countDocuments(),
            Role.countDocuments(),
            Staff.countDocuments()
        ]);

        console.log(`   Permissions: ${existingPermissions}`);
        console.log(`   Roles: ${existingRoles}`);
        console.log(`   Staff: ${existingStaff}`);

        if (existingPermissions > 0 || existingRoles > 0 || existingStaff > 0) {
            const shouldContinue = await this.askQuestion('\nExisting data found. Continue? (y/N): ');
            if (shouldContinue.toLowerCase() !== 'y' && shouldContinue.toLowerCase() !== 'yes') {
                throw new Error('Setup cancelled by user');
            }
        }
    }

    /**
     * Create minimal essential permissions
     */
    async createMinimalPermissions() {
        console.log('\n🔐 Creating minimal permissions...');

        // Only create the most essential permissions
        const minimalPermissions = [
            { name: 'manage:all', description: 'Full system management access' },
            { name: 'read:staff', description: 'View staff information' },
            { name: 'read:roles', description: 'View roles and permissions' },
            { name: 'read:tours', description: 'View tour information' },
            { name: 'read:bookings', description: 'View booking information' }
        ];

        const createdPermissions = [];
        
        for (const permissionData of minimalPermissions) {
            try {
                const existingPermission = await Permission.findOne({ name: permissionData.name });
                if (!existingPermission) {
                    const permission = await Permission.create(permissionData);
                    createdPermissions.push(permission);
                    console.log(`   ✅ Created: ${permission.name}`);
                } else {
                    console.log(`   ⚠️  Already exists: ${permissionData.name}`);
                }
            } catch (error) {
                console.error(`   ❌ Error creating ${permissionData.name}: ${error.message}`);
            }
        }

        console.log(`✅ Created ${createdPermissions.length} permissions`);
        return createdPermissions;
    }

    /**
     * Create minimal essential roles
     */
    async createMinimalRoles() {
        console.log('\n👥 Creating minimal roles...');

        // Get all permissions
        const allPermissions = await Permission.find({});
        const permissionMap = {};
        allPermissions.forEach(p => {
            permissionMap[p.name] = p._id;
        });

        // Only create essential roles
        const minimalRoles = [
            {
                name: 'Super Admin',
                description: 'Full system access',
                permissions: Object.values(permissionMap) // All available permissions
            },
            {
                name: 'Basic User',
                description: 'Basic read-only access',
                permissions: [
                    'read:tours',
                    'read:bookings'
                ].map(name => permissionMap[name]).filter(Boolean)
            }
        ];

        const createdRoles = [];
        
        for (const roleData of minimalRoles) {
            try {
                const existingRole = await Role.findOne({ name: roleData.name });
                if (!existingRole) {
                    const role = await Role.create(roleData);
                    createdRoles.push(role);
                    console.log(`   ✅ Created: ${role.name} (${role.permissions.length} permissions)`);
                } else {
                    console.log(`   ⚠️  Already exists: ${roleData.name}`);
                }
            } catch (error) {
                console.error(`   ❌ Error creating ${roleData.name}: ${error.message}`);
            }
        }

        console.log(`✅ Created ${createdRoles.length} roles`);
        return createdRoles;
    }

    /**
     * Create super admin account
     */
    async createSuperAdminAccount() {
        console.log('\n👤 Setting up Super Admin account...');

        // Check if super admin already exists
        const existingSuperAdmin = await Staff.findOne({
            email: MINIMAL_CONFIG.defaultSuperAdmin.email
        });

        if (existingSuperAdmin) {
            console.log('ℹ️  Super admin account already exists');
            const shouldReset = await this.askQuestion('Reset super admin password? (y/N): ');
            
            if (shouldReset.toLowerCase() === 'y' || shouldReset.toLowerCase() === 'yes') {
                const newPassword = await this.askQuestion('Enter new password (min 8 chars): ', true);
                
                if (newPassword.length < 8) {
                    throw new Error('Password must be at least 8 characters long');
                }

                existingSuperAdmin.password = newPassword;
                existingSuperAdmin.lastPasswordChange = new Date();
                await existingSuperAdmin.save();
                
                console.log('✅ Super admin password updated');
            }
            return;
        }

        // Create new super admin
        const password = await this.askQuestion('Enter super admin password (min 8 chars): ', true);
        
        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        // Find Super Admin role
        const superAdminRole = await Role.findOne({ name: 'Super Admin' });
        if (!superAdminRole) {
            throw new Error('Super Admin role not found. Please ensure roles are created first.');
        }

        // Create super admin account
        try {
            const superAdmin = await Staff.create({
                ...MINIMAL_CONFIG.defaultSuperAdmin,
                password,
                role: superAdminRole._id,
                isEmailVerified: true,
                isActive: true
            });

            console.log('✅ Super admin account created successfully');
            console.log(`   Email: ${superAdmin.email}`);
            console.log(`   Employee ID: ${superAdmin.employeeId}`);
        } catch (error) {
            throw new Error(`Failed to create super admin: ${error.message}`);
        }
    }

    /**
     * Ask user a question and return response
     */
    askQuestion(question, hidden = false) {
        return new Promise((resolve) => {
            if (hidden) {
                // Simple password hiding for setup
                const stdin = process.stdin;
                stdin.setRawMode(true);
                stdin.resume();
                stdin.setEncoding('utf8');
                
                process.stdout.write(question);
                
                let password = '';
                stdin.on('data', function(char) {
                    char = char + '';
                    
                    switch (char) {
                        case '\n':
                        case '\r':
                        case '\u0004':
                            stdin.setRawMode(false);
                            stdin.pause();
                            process.stdout.write('\n');
                            resolve(password);
                            break;
                        case '\u0003':
                            process.exit();
                            break;
                        case '\u007f': // Backspace
                            if (password.length > 0) {
                                password = password.slice(0, -1);
                                process.stdout.write('\b \b');
                            }
                            break;
                        default:
                            password += char;
                            process.stdout.write('*');
                            break;
                    }
                });
            } else {
                this.rl.question(question, resolve);
            }
        });
    }
}

// Check if this script is being run directly
if (require.main === module) {
    // Load environment variables
    require('dotenv').config();

    const setupManager = new MinimalSetup();
    setupManager.run().catch(error => {
        console.error('Setup failed:', error);
        process.exit(1);
    });
}

module.exports = MinimalSetup;