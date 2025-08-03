# 🎭 **Multi-Role System Guide**

## 📋 **Overview**

The KeyTour RBAC V2 system now supports **multiple roles per staff member**, providing enhanced flexibility and granular permission management.

### **Key Features**
- ✅ **Multiple roles** per staff member
- ✅ **Primary role** for default permissions
- ✅ **Additional roles** for extended access
- ✅ **Combined permissions** from all roles
- ✅ **Role removal** without losing access
- ✅ **Backward compatibility** with single-role systems

---

## 🏗️ **Architecture Changes**

### **Before (Single Role)**
```javascript
{
  _id: "staff123",
  name: "John Doe",
  email: "john@keytour.com",
  role: ObjectId("role456")  // Single role reference
}
```

### **After (Multi-Role)**
```javascript
{
  _id: "staff123",
  name: "John Doe", 
  email: "john@keytour.com",
  primaryRole: ObjectId("role456"),    // Main role
  roles: [                             // All assigned roles
    ObjectId("role456"),               // Primary role (included)
    ObjectId("role789"),               // Additional role 1
    ObjectId("role101")                // Additional role 2
  ]
}
```

---

## 🚀 **Migration from Single Role**

### **Automatic Migration**
```bash
# Run the migration script
node V2/scripts/migrate-to-multi-role.js
```

### **What the Migration Does:**
1. **Analyzes** existing staff records
2. **Creates backup** of current data
3. **Converts** `role` field to `primaryRole`
4. **Adds** current role to `roles` array
5. **Validates** migration success
6. **Optionally cleans up** old `role` field

### **Manual Migration (if needed)**
```javascript
// Update existing staff records
await Staff.updateMany({}, [
  {
    $set: {
      primaryRole: "$role",
      roles: ["$role"]
    }
  }
]);
```

---

## 📡 **API Endpoints**

### **1. Assign Primary Role**
```http
POST /api/v2/rbac/assign-role
Content-Type: application/json

{
  "staffId": "staff123",
  "roleId": "role456"
}
```
**Result:** Sets both `primaryRole` and adds to `roles` array

### **2. Add Additional Role**
```http
POST /api/v2/rbac/add-additional-role
Content-Type: application/json

{
  "staffId": "staff123", 
  "roleId": "role789"
}
```
**Result:** Adds role to `roles` array (doesn't change primary)

### **3. Remove Role**
```http
POST /api/v2/rbac/remove-role
Content-Type: application/json

{
  "staffId": "staff123",
  "roleId": "role789"
}
```
**Result:** Removes from `roles` array (cannot remove primary role)

### **4. Set Primary Role**
```http
POST /api/v2/rbac/set-primary-role
Content-Type: application/json

{
  "staffId": "staff123",
  "roleId": "role789"
}
```
**Result:** Changes primary role (role must already be assigned)

### **5. Get Staff Roles**
```http
GET /api/v2/rbac/staff/staff123/roles
```
**Result:** Returns all roles and permissions for staff member

### **6. Bulk Role Assignment**
```http
POST /api/v2/rbac/bulk-assign-roles
Content-Type: application/json

{
  "assignments": [
    {
      "staffId": "staff123",
      "roleId": "role456",
      "setPrimary": true
    },
    {
      "staffId": "staff124", 
      "roleId": "role789",
      "setPrimary": false
    }
  ]
}
```

---

## 💼 **Usage Examples**

### **Example 1: Project Manager with Multiple Responsibilities**
```javascript
// Sarah is a Project Manager who also handles HR tasks
const sarah = {
  primaryRole: "project_manager",     // Main responsibility
  roles: [
    "project_manager",               // Can manage projects
    "hr_assistant",                  // Can view employee data
    "content_reviewer"               // Can review tour content
  ]
};

// Sarah's combined permissions:
// - create:projects, manage:teams (from project_manager)
// - read:employees, update:profiles (from hr_assistant)  
// - review:content, approve:tours (from content_reviewer)
```

### **Example 2: Temporary Access**
```javascript
// Give John temporary access to financial reports
await RBACService.addAdditionalRoleToStaff('john123', 'finance_viewer');

// Remove temporary access after audit
await RBACService.removeRoleFromStaff('john123', 'finance_viewer');
```

### **Example 3: Role Promotion**
```javascript
// Promote Alice from Assistant to Manager
await RBACService.addAdditionalRoleToStaff('alice123', 'manager');
await RBACService.setPrimaryRoleForStaff('alice123', 'manager');
// Keep assistant role for transition period
```

---

## 🔒 **Permission Resolution**

### **How Permissions are Calculated**
```javascript
// Staff with multiple roles
const staff = {
  primaryRole: "content_editor",
  roles: ["content_editor", "social_media", "basic_user"]
};

// Permission resolution:
// 1. Get permissions from ALL roles
// 2. Combine and deduplicate
// 3. Return union of all permissions

const allPermissions = [
  ...contentEditorPermissions,  // create:content, edit:content
  ...socialMediaPermissions,    // post:social, schedule:posts  
  ...basicUserPermissions       // read:content, view:profile
];
// Result: ["create:content", "edit:content", "post:social", "schedule:posts", "read:content", "view:profile"]
```

### **Permission Checking**
```javascript
// Checks ALL roles for permission
const hasPermission = await RBACService.hasPermission('staff123', 'create:content');

// Returns true if ANY role has the permission
const hasAnyPermission = await RBACService.hasAnyPermission('staff123', ['create:content', 'edit:tours']);

// Returns true only if ALL permissions are available
const hasAllPermissions = await RBACService.hasAllPermissions('staff123', ['create:content', 'edit:content']);
```

---

## 📊 **Best Practices**

### **1. Role Design Strategy**
```javascript
// ✅ Good: Specific, focused roles
const roles = [
  'content_creator',     // Creates blog posts, tour descriptions
  'social_media',        // Manages social media accounts
  'customer_support',    // Handles customer inquiries
  'tour_guide',          // Manages tour operations
  'finance_viewer'       // Views financial reports
];

// ❌ Avoid: Overly broad roles
const badRoles = [
  'super_user',          // Too broad
  'everything_access'    // Not specific enough
];
```

### **2. Primary Role Selection**
```javascript
// Primary role should be the staff member's main responsibility
const staff = {
  primaryRole: 'tour_guide',        // Main job function
  roles: [
    'tour_guide',                   // Primary role (always included)
    'content_contributor',          // Can contribute tour content
    'emergency_contact'             // Can be contacted in emergencies
  ]
};
```

### **3. Role Lifecycle Management**
```javascript
// Temporary access pattern
const grantTemporaryAccess = async (staffId, roleId, durationDays) => {
  // Add role
  await RBACService.addAdditionalRoleToStaff(staffId, roleId);
  
  // Schedule removal (implement with cron job or scheduler)
  scheduleRoleRemoval(staffId, roleId, durationDays);
};

// Role transition pattern  
const promoteStaff = async (staffId, newPrimaryRoleId) => {
  // Add new role first
  await RBACService.addAdditionalRoleToStaff(staffId, newPrimaryRoleId);
  
  // Set as primary
  await RBACService.setPrimaryRoleForStaff(staffId, newPrimaryRoleId);
  
  // Optionally remove old roles after transition period
};
```

### **4. Error Handling**
```javascript
try {
  await RBACService.removeRoleFromStaff(staffId, roleId);
} catch (error) {
  if (error.message.includes('Cannot remove primary role')) {
    // Guide user to set different primary role first
    throw new Error('Please set a different primary role before removing this role');
  }
  throw error;
}
```

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. Cannot Remove Primary Role**
```javascript
// Error: Cannot remove primary role
// Solution: Set different primary role first
await RBACService.setPrimaryRoleForStaff(staffId, otherRoleId);
await RBACService.removeRoleFromStaff(staffId, oldPrimaryRoleId);
```

#### **2. Role Already Assigned**
```javascript
// Error: Role is already assigned
// Solution: Check existing roles first
const staffRoles = await RBACService.getStaffRoles(staffId);
const hasRole = staffRoles.additionalRoles.some(role => role._id === roleId);
if (!hasRole) {
  await RBACService.addAdditionalRoleToStaff(staffId, roleId);
}
```

#### **3. No Permissions After Migration**
```javascript
// Check if migration completed successfully
const staff = await Staff.findById(staffId).populate('roles');
console.log('Roles:', staff.roles.map(r => r.name));

// Verify permissions are populated
const permissions = await RBACService.getUserPermissions(staffId);
console.log('Permissions:', permissions);
```

### **Debug Commands**
```bash
# Check staff role structure
node -e "
const Staff = require('./V2/models/StaffModel');
Staff.findOne().populate(['primaryRole', 'roles']).then(console.log);
"

# Verify permission resolution
node -e "
const RBACService = require('./V2/services/RBACService');
RBACService.getUserPermissions('STAFF_ID').then(console.log);
"
```

---

## ⚡ **Performance Considerations**

### **Database Indexing**
```javascript
// Indexes are automatically created for performance
staffSchema.index({ primaryRole: 1 });
staffSchema.index({ roles: 1 });
```

### **Query Optimization**
```javascript
// ✅ Efficient: Single query with population
const staff = await Staff.findById(staffId).populate([
  { path: 'primaryRole', populate: { path: 'permissions' } },
  { path: 'roles', populate: { path: 'permissions' } }
]);

// ❌ Inefficient: Multiple separate queries
const staff = await Staff.findById(staffId);
const primaryRole = await Role.findById(staff.primaryRole).populate('permissions');
const roles = await Role.find({ _id: { $in: staff.roles } }).populate('permissions');
```

### **Caching Strategy**
```javascript
// Cache user permissions for better performance
const Redis = require('redis');
const redis = Redis.createClient();

const getCachedPermissions = async (userId) => {
  const cached = await redis.get(`permissions:${userId}`);
  if (cached) return JSON.parse(cached);
  
  const permissions = await RBACService.getUserPermissions(userId);
  await redis.setex(`permissions:${userId}`, 300, JSON.stringify(permissions)); // 5 min cache
  return permissions;
};
```

---

## 🧪 **Testing**

### **Unit Tests Example**
```javascript
describe('Multi-Role System', () => {
  test('should add additional role to staff', async () => {
    const staff = await RBACService.addAdditionalRoleToStaff(staffId, roleId);
    expect(staff.roles).toContain(roleId);
  });

  test('should combine permissions from all roles', async () => {
    // Staff has roles: content_editor + social_media
    const permissions = await RBACService.getUserPermissions(staffId);
    expect(permissions).toContain('create:content');  // from content_editor
    expect(permissions).toContain('post:social');     // from social_media
  });

  test('should prevent removing primary role', async () => {
    await expect(
      RBACService.removeRoleFromStaff(staffId, primaryRoleId)
    ).rejects.toThrow('Cannot remove primary role');
  });
});
```

---

## 📚 **Resources**

- **API Documentation**: Full Swagger docs available at `/api/v2/docs`
- **Postman Collection**: `V2/postman/KeyTour_RBAC_V2.postman_collection.json`
- **Migration Script**: `V2/scripts/migrate-to-multi-role.js`
- **Database Cleanup**: `V2/scripts/cleanup-database.js`

## 🎯 **Next Steps**

1. **Run migration** for existing systems
2. **Test role assignments** with Postman collection
3. **Implement role-based UI** in your frontend
4. **Set up monitoring** for permission usage
5. **Plan role hierarchy** for your organization

---

**💡 Pro Tip**: Start with single roles per staff and gradually add additional roles as needed. This approach maintains simplicity while providing flexibility for growth.