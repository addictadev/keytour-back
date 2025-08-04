# 🏝️ **Destination RBAC Integration Guide**

## **Overview**
This guide explains how RBAC permissions have been integrated with destination management in the KeyTour system. The implementation is **production-safe** and maintains backward compatibility.

## **🔒 Access Control**

### **Permission Structure**
Only **Admin** users have full control over destinations:

| Role | Permissions | Access Level |
|------|------------|--------------|
| **Super Admin** | `create:destinations`, `read:destinations`, `update:destinations`, `delete:destinations` | Full Access |
| **Admin** | `create:destinations`, `read:destinations`, `update:destinations`, `delete:destinations` | Full Access |
| **Manager** | `read:destinations` | Read Only |
| **Content Manager** | `read:destinations` | Read Only |
| **Customer Support** | `read:destinations` | Read Only |
| **Vendor** | `read:destinations` | Read Only |
| **Public/Guest** | N/A | Read Only (via public routes) |

## **🛡️ Implementation Details**

### **1. Route Protection**
The destination routes are protected with both authentication and RBAC:

```javascript
// Public routes - no authentication required
GET  /api/destinations      // Get all destinations
GET  /api/destinations/:id  // Get single destination

// Admin-only routes
POST   /api/destinations     // Create destination (Admin only)
PUT    /api/destinations/:id // Update destination (Admin only)
DELETE /api/destinations/:id // Delete destination (Admin only)
```

### **2. Middleware Stack**
Each protected route uses:
1. `authMiddleware('admin')` - Checks if user is admin
2. `rbacWrapper('permission')` - Checks specific RBAC permission
3. `uploadFiles` - Handles image uploads (where applicable)
4. Controller method

### **3. Production-Safe Wrapper**
The `rbacWrapper` middleware ensures:
- ✅ No breaking changes to existing functionality
- ✅ Graceful fallback if RBAC is disabled
- ✅ Compatible with existing error responses
- ✅ Works with both old and new permission systems

## **🚀 Setup Instructions**

### **Step 1: Run Permission Migration**
```bash
# Add destination permissions to existing system
node V2/scripts/add-destination-permissions.js
```

This script will:
- Add destination permissions to the database
- Update existing roles with appropriate permissions
- Maintain backward compatibility

### **Step 2: Environment Configuration**
```bash
# Enable RBAC in production (optional)
ENABLE_RBAC=true
```

### **Step 3: Verify Setup**
Test the implementation:
```bash
# 1. Try to create a destination as admin (should work)
curl -X POST http://localhost:3000/api/destinations \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "role: admin" \
  -F "name=New Destination" \
  -F "image=@destination.jpg"

# 2. Try to create a destination as vendor (should fail)
curl -X POST http://localhost:3000/api/destinations \
  -H "Authorization: Bearer VENDOR_TOKEN" \
  -H "role: vendor" \
  -F "name=New Destination" \
  -F "image=@destination.jpg"
```

## **🔍 Troubleshooting**

### **Issue: Vendor Can Still Create Destinations**
**Solution**: Ensure you've:
1. Updated the routes file with the new middleware
2. Run the permission migration script
3. Restarted the server

### **Issue: Getting 403 Forbidden for Admin**
**Solution**: Check that:
1. Admin role has destination permissions
2. Token is valid and includes role information
3. RBAC wrapper is not blocking due to missing permissions

### **Issue: Public Routes Require Authentication**
**Solution**: Ensure GET routes are placed before protected routes

## **📊 Testing with Postman**

### **Test Flow**
1. **Login as Admin** → Should get token
2. **Create Destination** → Should succeed
3. **Update Destination** → Should succeed
4. **Delete Destination** → Should succeed

5. **Login as Vendor** → Should get token
6. **Try Create Destination** → Should get 403
7. **View Destinations** → Should succeed

### **Expected Responses**

**Success (Admin):**
```json
{
  "status": "success",
  "data": {
    "destination": {
      "_id": "...",
      "name": "Beautiful Beach",
      ...
    }
  }
}
```

**Forbidden (Non-Admin):**
```json
{
  "status": "fail",
  "message": "You do not have permission to perform this action"
}
```

## **🔄 Rollback Plan**

If you need to rollback:

1. **Remove RBAC wrapper** from routes:
```javascript
// From this:
authMiddleware('admin'),
rbacWrapper('create:destinations'),

// To this:
authMiddleware('admin'),
```

2. **Disable RBAC** (if using env variable):
```bash
ENABLE_RBAC=false
```

The system will continue working with just the `authMiddleware` check.

## **📝 Notes**

- The implementation maintains **100% backward compatibility**
- No changes to controller logic or response formats
- RBAC adds an extra layer of security on top of existing auth
- Public read access is maintained for all users
- Only admins can modify destination data

## **🤝 Support**

For issues or questions:
1. Check the error logs for RBAC-related messages
2. Verify permissions in the database
3. Ensure middleware order is correct
4. Contact the backend team for assistance

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Production Ready