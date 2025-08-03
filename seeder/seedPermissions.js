const Permission = require('../src/model/PermissionsModel');
const Role = require('../src/model/RoleModel');
const mongoose = require('mongoose');

const permissions = {
  // Tour permissions
  tour: [
    'create:tour',
    'read:tour',
    'update:tour',
    'delete:tour',
    'cancel:tour',
    'resend:tour',
    'manage:tourStatus'
  ],
  // User permissions
  user: [
    'create:user',
    'read:user',
    'update:user',
    'delete:user',
    'manage:wishlist'
  ],
  // Vendor permissions
  vendor: [
    'create:vendor',
    'read:vendor',
    'update:vendor',
    'delete:vendor',
    'manage:vendorStatus'
  ],
  // Blog permissions
  blog: [
    'create:blog',
    'read:blog',
    'update:blog',
    'delete:blog'
  ],
  // Booking permissions
  booking: [
    'create:booking',
    'read:booking',
    'update:booking',
    'delete:booking',
    'cancel:booking',
    'process:payment'
  ],
  // Review permissions
  review: [
    'create:review',
    'read:review',
    'update:review',
    'delete:review'
  ],
  // Destination permissions
  destination: [
    'create:destination',
    'read:destination',
    'update:destination',
    'delete:destination'
  ],
  // Settings permissions
  settings: [
    'manage:appSettings',
    'read:appSettings'
  ]
};

const rolePermissions = {
  admin: Object.values(permissions).flat(), // Admin gets all permissions
  vendor: [
    'read:tour',
    'create:tour',
    'update:tour',
    'delete:tour',
    'read:booking',
    'update:booking',
    'read:review',
    'read:destination',
    'read:appSettings'
  ],
  user: [
    'read:tour',
    'create:booking',
    'cancel:booking',
    'create:review',
    'update:review',
    'delete:review',
    'read:destination',
    'manage:wishlist',
    'read:appSettings'
  ]
};

async function seedPermissions() {
  try {
    // Clear existing permissions and roles
    await Permission.deleteMany({});
    await Role.deleteMany({});

    // Create all permissions
    const createdPermissions = {};
    for (const [category, categoryPermissions] of Object.entries(permissions)) {
      for (const permission of categoryPermissions) {
        const createdPermission = await Permission.create({ name: permission });
        createdPermissions[permission] = createdPermission._id;
      }
    }

    // Create roles with their respective permissions
    for (const [role, rolePerms] of Object.entries(rolePermissions)) {
      await Role.create({
        name: role,
        permissions: rolePerms.map(perm => createdPermissions[perm])
      });
    }

    console.log('Permissions and roles seeded successfully!');
  } catch (error) {
    console.error('Error seeding permissions:', error);
  }
}

module.exports = seedPermissions;