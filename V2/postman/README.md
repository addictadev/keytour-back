# KeyTour RBAC V2 - Postman Testing Collection

This directory contains comprehensive Postman collections for testing the entire RBAC system flow.

## 📁 Files Included

- **`KeyTour_RBAC_V2.postman_collection.json`** - Main collection with all API endpoints
- **`environment.json`** - Environment variables template
- **`README.md`** - This documentation file

## 🚀 Quick Setup

### 1. Import Collection and Environment

1. Open Postman
2. Click **Import** 
3. Drag and drop both JSON files or use **Choose Files**:
   - `KeyTour_RBAC_V2.postman_collection.json`
   - `environment.json`

### 2. Configure Environment

1. Select **"KeyTour RBAC V2 Environment"** from the environment dropdown
2. Update the `baseUrl` if your server runs on a different port:
   - Default: `http://localhost:3000`
   - Change to your server URL if different

### 3. Run Setup Script

Before testing, make sure your RBAC system is initialized:

```bash
node V2/scripts/setup.js
```

This creates default permissions, roles, and super admin account.

## 📋 Collection Structure

### 🏥 **Health & Setup**
- API health checks
- System initialization
- Service status verification

### 🔐 **Authentication**
- Login/logout flow
- Token refresh mechanism
- Password management
- Session management
- Profile operations

### 🔑 **RBAC Management**
- **Permissions**: CRUD operations, bulk creation, statistics
- **Roles**: Role management, permission assignment
- **Permission Checking**: Single/multiple permission validation
- **System Overview**: RBAC system status

### 👤 **Staff Management**
- Complete staff lifecycle
- Role assignment
- Account status management
- Search and filtering
- Export functionality
- Bulk operations

### 🧪 **Permission Testing Scenarios**
- **Admin Access Test**: Verify admin can access all features
- **Limited User Test**: Verify permission restrictions work
- **Token Security Test**: Verify token invalidation works

### 🚨 **Error Handling Tests**
- Input validation tests
- Rate limiting verification
- Security error responses

## 🔄 Automated Testing Flow

The collection is designed to be run sequentially and includes automatic:

- **Token Management**: Tokens are automatically extracted and stored
- **ID Extraction**: User IDs, role IDs, etc., are auto-populated
- **Test Assertions**: Built-in tests verify responses
- **Environment Updates**: Variables are updated as tests run

## 🎯 Test Scenarios

### **Scenario 1: Complete RBAC Flow**

```
1. Health Check → System Status
2. Login → Get Access Token
3. Create Permission → Store Permission ID
4. Create Role → Store Role ID
5. Assign Permission to Role
6. Create Staff → Store Staff ID
7. Assign Role to Staff
8. Test Permission Checking
9. Logout → Invalidate Tokens
```

### **Scenario 2: Permission Testing**

```
1. Login as Super Admin
2. Verify admin access to all endpoints
3. Create limited user (Customer Support)
4. Login as limited user
5. Try accessing restricted endpoints (should fail)
6. Verify access to allowed endpoints (should work)
```

### **Scenario 3: Security Testing**

```
1. Test with invalid tokens
2. Test without authentication
3. Test after token logout
4. Test rate limiting with multiple failed attempts
5. Test input validation errors
```

## 📊 Environment Variables

The collection uses these environment variables (auto-populated):

| Variable | Description | Auto-Set |
|----------|-------------|----------|
| `baseUrl` | API base URL | Manual |
| `accessToken` | JWT access token | ✅ Login |
| `refreshToken` | Refresh token | ✅ Login |
| `userId` | Current user ID | ✅ Login |
| `staffId` | Created staff ID | ✅ Staff creation |
| `roleId` | Created role ID | ✅ Role creation |
| `permissionId` | Created permission ID | ✅ Permission creation |
| `adminToken` | Admin token for testing | ✅ Admin login |
| `limitedToken` | Limited user token | ✅ Limited user login |

## 🔧 Running Tests

### **Individual Requests**
1. Select any request
2. Click **Send**
3. Check the **Test Results** tab for assertions

### **Collection Runner**
1. Click on collection name
2. Click **Run**
3. Select environment
4. Configure iterations (1 for full flow)
5. Click **Run KeyTour RBAC V2**

### **Newman (CLI)**
```bash
# Install Newman
npm install -g newman

# Run collection
newman run KeyTour_RBAC_V2.postman_collection.json \
  -e environment.json \
  --reporters cli,html \
  --reporter-html-export results.html
```

## 🧪 Test Assertions

Each request includes built-in tests:

```javascript
// Status code verification
pm.test('Request successful', function () {
    pm.response.to.have.status(200);
});

// Response time check
pm.test('Response time is reasonable', function () {
    pm.expect(pm.response.responseTime).to.be.below(5000);
});

// Data extraction
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set('accessToken', response.data.accessToken);
}

// Security headers check
pm.test('Security headers present', function () {
    pm.expect(pm.response.headers.get('X-Content-Type-Options')).to.exist;
});
```

## 🔍 Expected Results

### **Successful Responses**
- ✅ `200 OK` - Successful operations
- ✅ `201 Created` - Resource creation
- ✅ `204 No Content` - Successful deletion

### **Expected Errors**
- ❌ `400 Bad Request` - Validation errors
- ❌ `401 Unauthorized` - Authentication required
- ❌ `403 Forbidden` - Insufficient permissions
- ❌ `404 Not Found` - Resource not found
- ❌ `409 Conflict` - Duplicate entries
- ❌ `429 Too Many Requests` - Rate limiting

## 🐛 Troubleshooting

### **Common Issues**

1. **"Collection failed on first request"**
   - Ensure server is running on correct port
   - Check `baseUrl` in environment

2. **"Token expired errors"**
   - Run login request to refresh tokens
   - Check system time synchronization

3. **"Permission denied errors"**
   - Ensure RBAC system is initialized
   - Run setup script: `node V2/scripts/setup.js`

4. **"Database connection errors"**
   - Verify MongoDB is running
   - Check database connection string

### **Debug Tips**

1. **Check Console Logs**
   - Open Postman Console (View → Show Postman Console)
   - Review request/response details

2. **Verify Environment Variables**
   - Check current environment is selected
   - Verify variables have values

3. **Test Individual Requests**
   - Start with health check
   - Test login separately
   - Verify tokens are set

## 📈 Performance Testing

The collection includes basic performance tests:

- **Response Time**: All requests should complete under 5 seconds
- **Rate Limiting**: Tests multiple rapid requests
- **Concurrent Users**: Use Newman with multiple iterations

### **Load Testing Example**
```bash
# Test with 10 virtual users
newman run KeyTour_RBAC_V2.postman_collection.json \
  -e environment.json \
  -n 10 \
  --delay-request 100
```

## 🔄 Continuous Integration

The collection can be integrated into CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run API Tests
  run: |
    npm install -g newman
    newman run V2/postman/KeyTour_RBAC_V2.postman_collection.json \
      -e V2/postman/environment.json \
      --reporters cli,junit \
      --reporter-junit-export results.xml
```

## 📞 Support

If you encounter issues:

1. **Check this README** for troubleshooting steps
2. **Review server logs** for detailed error information
3. **Verify environment setup** matches requirements
4. **Test individual endpoints** to isolate issues

---

**Happy Testing! 🎉**

The collection provides comprehensive coverage of the entire RBAC system, ensuring all functionality works as expected and security measures are properly implemented.