/**
 * RBAC System Setup Script - Initialize the enhanced RBAC system
 * 
 * Features:
 * - Database connection validation
 * - Default permissions creation
 * - Default roles creation
 * - Super admin account creation
 * - System health checks
 * 
 * Usage: node V2/scripts/setup.js
 * 
 * @author Expert Backend Developer
 * @version 2.0.0
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Import models and services
const Staff = require('../models/StaffModel');
const Role = require('../../src/model/RoleModel');
const Permission = require('../../src/model/PermissionsModel');
const RBACService = require('../services/RBACService');
const TokenManagementService = require('../services/TokenManagementService');

// Setup configuration
const SETUP_CONFIG = {
    defaultSuperAdmin: {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@keytour.com',
        department: 'IT',
        employeeId: 'SUPER001',
        position: 'System Administrator'
    }
};

class SetupManager {
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
            console.log('\n🚀 KeyTour RBAC System Setup\n');
            console.log('This script will initialize the enhanced RBAC system with:');
            console.log('- Default permissions and roles');
            console.log('- Super admin account');
            console.log('- Token management system');
            console.log('- System health checks\n');

            // Check if setup should continue
            const shouldContinue = await this.askQuestion('Do you want to continue? (y/N): ');
            if (shouldContinue.toLowerCase() !== 'y' && shouldContinue.toLowerCase() !== 'yes') {
                console.log('Setup cancelled.');
                process.exit(0);
            }

            // Connect to database
            await this.connectToDatabase();

            // Run setup steps
            await this.checkExistingData();
            await this.createDefaultPermissions();
            await this.createDefaultRoles();
            await this.createSuperAdminAccount();
            await this.initializeTokenManagement();
            await this.runHealthChecks();

            console.log('\n✅ RBAC System setup completed successfully!\n');
            console.log('Next steps:');
            console.log('1. Update your main application to use V2 routes');
            console.log('2. Configure environment variables');
            console.log('3. Test the authentication endpoints');
            console.log('4. Create additional staff accounts as needed\n');

        } catch (error) {
            console.error('\n❌ Setup failed:', error.message);
            console.error(error.stack);
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
            await mongoose.connect('mongodb+srv://adalaapp:123456789ma@cluster0.a93vbj1.mongodb.net/keytour', {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('✅ Database connected successfully');
        } catch (error) {
            throw new Error(`Database connection failed: ${error.message}`);
        }
    }

    /**
     * Check for existing data and warn user
     */
    async checkExistingData() {
        console.log('\n🔍 Checking existing data...');

        const [existingPermissions, existingRoles, existingStaff] = await Promise.all([
            Permission.countDocuments(),
            Role.countDocuments(),
            Staff.countDocuments()
        ]);

        if (existingPermissions > 0 || existingRoles > 0 || existingStaff > 0) {
            console.log(`\n⚠️  Existing data found:`);
            console.log(`- Permissions: ${existingPermissions}`);
            console.log(`- Roles: ${existingRoles}`);
            console.log(`- Staff: ${existingStaff}`);

            const shouldContinue = await this.askQuestion('\nThis will add to existing data. Continue? (y/N): ');
            if (shouldContinue.toLowerCase() !== 'y' && shouldContinue.toLowerCase() !== 'yes') {
                throw new Error('Setup cancelled by user');
            }
        } else {
            console.log('✅ No existing data found, proceeding with fresh setup');
        }
    }

    /**
     * Create default permissions
     */
    async createDefaultPermissions() {
        console.log('\n🔐 Creating default permissions...');

        try {
            const createdPermissions = await RBACService.createDefaultPermissions();
            console.log(`✅ Created ${createdPermissions.length} permissions`);
            
            if (createdPermissions.length > 0) {
                console.log('   Created permissions:');
                createdPermissions.forEach(permission => {
                    console.log(`   - ${permission.name}`);
                });
            }
        } catch (error) {
            throw new Error(`Failed to create permissions: ${error.message}`);
        }
    }

    /**
     * Create default roles
     */
    async createDefaultRoles() {
        console.log('\n👥 Creating default roles...');

        try {
            const createdRoles = await RBACService.createDefaultRoles();
            console.log(`✅ Created ${createdRoles.length} roles`);
            
            if (createdRoles.length > 0) {
                console.log('   Created roles:');
                createdRoles.forEach(role => {
                    console.log(`   - ${role.name} (${role.permissions.length} permissions)`);
                });
            }
        } catch (error) {
            throw new Error(`Failed to create roles: ${error.message}`);
        }
    }

    /**
     * Create super admin account
     */
    async createSuperAdminAccount() {
        console.log('\n👤 Setting up Super Admin account...');

        // Check if super admin already exists
        const existingSuperAdmin = await Staff.findOne({
            email: SETUP_CONFIG.defaultSuperAdmin.email
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
                ...SETUP_CONFIG.defaultSuperAdmin,
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
     * Initialize token management system
     */
    async initializeTokenManagement() {
        console.log('\n🎫 Initializing token management system...');

        try {
            TokenManagementService.init();
            console.log('✅ Token management system initialized');
            console.log('   - Cleanup tasks scheduled');
            console.log('   - Maintenance tasks scheduled');
            console.log('   - Security monitoring enabled');
        } catch (error) {
            console.warn(`⚠️  Token management initialization warning: ${error.message}`);
        }
    }

    /**
     * Run system health checks
     */
    async runHealthChecks() {
        console.log('\n🏥 Running system health checks...');

        try {
            // Check database connection
            const dbState = mongoose.connection.readyState;
            if (dbState !== 1) {
                throw new Error('Database connection not ready');
            }
            console.log('✅ Database connection healthy');

            // Check permissions
            const permissionCount = await Permission.countDocuments();
            if (permissionCount === 0) {
                throw new Error('No permissions found');
            }
            console.log(`✅ Permissions loaded (${permissionCount} total)`);

            // Check roles
            const roleCount = await Role.countDocuments();
            if (roleCount === 0) {
                throw new Error('No roles found');
            }
            console.log(`✅ Roles loaded (${roleCount} total)`);

            // Check super admin
            const superAdmin = await Staff.findOne({ email: SETUP_CONFIG.defaultSuperAdmin.email })
                .populate('role');
            if (!superAdmin) {
                throw new Error('Super admin account not found');
            }
            console.log('✅ Super admin account verified');

            // Check role-permission relationships
            const superAdminRole = await Role.findOne({ name: 'Super Admin' }).populate('permissions');
            if (!superAdminRole || superAdminRole.permissions.length === 0) {
                throw new Error('Super admin role has no permissions');
            }
            console.log(`✅ Role-permission relationships verified (${superAdminRole.permissions.length} permissions for Super Admin)`);

            console.log('\n🎉 All health checks passed!');

        } catch (error) {
            throw new Error(`Health check failed: ${error.message}`);
        }
    }

    /**
     * Ask user a question and return response
     * @param {string} question - Question to ask
     * @param {boolean} hidden - Whether to hide input (for passwords)
     * @returns {Promise<string>} - User response
     */
    askQuestion(question, hidden = false) {
        return new Promise((resolve) => {
            if (hidden) {
                // Simple password hiding (not completely secure, but good enough for setup)
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

    const setupManager = new SetupManager();
    setupManager.run().catch(error => {
        console.error('Setup failed:', error);
        process.exit(1);
    });
}

module.exports = SetupManager;