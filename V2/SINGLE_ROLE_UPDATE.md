# 🔄 **Single Role System Update**

## **Overview**
The V2 RBAC system has been updated to use a **single role per staff member** instead of multiple roles. This simplifies role management and aligns with the original system design.

## **What Changed**

### **1. Database Schema**
- **Before**: Staff had `primaryRole` and `roles[]` fields
- **After**: Staff has a single `role` field

### **2. API Endpoints Removed**
The following multi-role endpoints have been removed:
- `POST /api/v2/rbac/remove-role`
- `POST /api/v2/rbac/add-additional-role`
- `POST /api/v2/rbac/set-primary-role`
- `GET /api/v2/rbac/staff/:staffId/roles`
- `POST /api/v2/rbac/bulk-assign-roles`

### **3. Single Role Assignment**
Staff members can only have one role at a time. To change a role:
```bash
POST /api/v2/rbac/assign-role
{
  "staffId": "staff_id_here",
  "roleId": "new_role_id_here"
}
```

## **Migration Guide**

### **For New Installations**
No changes needed. The setup scripts will create staff with single roles automatically.

### **For Existing Systems**
If you had staff with multiple roles, they will keep their primary role. Additional roles are ignored.

## **Benefits of Single Role**

1. **Simplicity**: Easier to understand and manage
2. **Performance**: Faster permission checks
3. **Clarity**: Clear hierarchy and responsibility
4. **Compatibility**: Matches the existing V1 system design

## **Role Hierarchy**

```
Super Admin
    ├── Admin
    ├── Manager
    ├── Content Manager
    └── Customer Support
```

Each role has specific permissions. If a staff member needs different permissions, they should be assigned to the appropriate role.

## **Example Usage**

### **Create Staff with Role**
```javascript
POST /api/v2/staff
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "role_id_here",
  "department": "IT",
  "employeeId": "EMP001"
}
```

### **Update Staff Role**
```javascript
POST /api/v2/rbac/assign-role
{
  "staffId": "staff_id_here",
  "roleId": "new_role_id_here"
}
```

### **Check Permissions**
```javascript
POST /api/v2/rbac/check-permission
{
  "userId": "staff_id_here",
  "permission": "create:tours"
}
```

## **Notes**

- The authentication flow remains unchanged
- Token structure remains the same
- Permission checking logic is simplified
- All existing permissions work as before

---

**Version**: 2.0.0 (Single Role)  
**Last Updated**: January 2025