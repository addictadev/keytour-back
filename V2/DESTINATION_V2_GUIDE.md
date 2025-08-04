# 🏝️ **V2 Destination Management with RBAC**

## **Overview**
This guide explains how to use the V2 destination routes with the enhanced RBAC system. The V2 implementation provides cleaner authentication and permission management compared to V1.

## **🔑 Key Differences from V1**

### **V1 (src/routes/destinationRoutes.js)**
- Uses `authMiddleware('admin')` for role checking
- Uses `rbacWrapper` for permission checking
- Mixed authentication approach

### **V2 (V2/routes/destinationRoutes.js)**
- Uses `AuthMiddleware.authenticate` for authentication
- Uses `PermissionMiddleware.requirePermissions` for permissions
- Clean, consistent approach with V2 RBAC system

## **📍 API Endpoints**

### **Public Endpoints (No Authentication Required)**

#### **1. Get All Destinations**
```http
GET /api/v2/destinations
```

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Items per page
- `search` (optional): Search term
- `sortBy` (optional): Field to sort by
- `sortOrder` (optional): 'asc' or 'desc'

**Example:**
```bash
curl http://localhost:3000/api/v2/destinations?page=1&limit=10
```

#### **2. Get Single Destination**
```http
GET /api/v2/destinations/:id
```

**Example:**
```bash
curl http://localhost:3000/api/v2/destinations/12345
```

### **Protected Endpoints (Requires Authentication + Permissions)**

#### **3. Create Destination**
```http
POST /api/v2/destinations
```

**Required Permission:** `create:destinations`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (Form Data):**
- `name`: Destination name
- `description`: Destination description
- `location`: Location details
- `price`: Price information
- `image`: Image file

**Example:**
```bash
curl -X POST http://localhost:3000/api/v2/destinations \
  -H "Authorization: Bearer <token>" \
  -F "name=Beautiful Beach" \
  -F "description=A stunning beach destination" \
  -F "location=Maldives" \
  -F "price=1500" \
  -F "image=@beach.jpg"
```

#### **4. Update Destination**
```http
PUT /api/v2/destinations/:id
```

**Required Permission:** `update:destinations`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Example:**
```bash
curl -X PUT http://localhost:3000/api/v2/destinations/12345 \
  -H "Authorization: Bearer <token>" \
  -F "name=Updated Beach Name" \
  -F "price=1800"
```

#### **5. Delete Destination**
```http
DELETE /api/v2/destinations/:id
```

**Required Permission:** `delete:destinations`

**Headers:**
```
Authorization: Bearer <token>
```

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/v2/destinations/12345 \
  -H "Authorization: Bearer <token>"
```

### **Enhanced Endpoints**

#### **6. Get Destinations with Wishlist Status**
```http
GET /api/v2/destinations/with-wishlist/status
```

**Headers (Optional):**
```
Authorization: Bearer <token>
```

**Note:** If authenticated, returns wishlist status for each destination. If not authenticated, returns destinations without wishlist info.

## **🔐 Authentication Flow**

### **1. Login to Get Token**
```bash
POST /api/v2/auth/login
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "staff": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "refresh_token_here",
    "permissions": ["create:destinations", "read:destinations", ...],
    "expiresAt": "2025-01-22T12:00:00Z"
  }
}
```

### **2. Use Token in Requests**
Include the access token in the Authorization header:
```
Authorization: Bearer <accessToken>
```

## **👥 Role Permissions**

| Role | Destination Permissions |
|------|------------------------|
| **Super Admin** | `create`, `read`, `update`, `delete` |
| **Admin** | `create`, `read`, `update`, `delete` |
| **Manager** | `read` only |
| **Content Manager** | `read` only |
| **Customer Support** | `read` only |
| **Vendor** | `read` only |

## **🚨 Error Handling**

### **Authentication Errors**
```json
{
  "status": "error",
  "message": "Authentication required",
  "code": 401
}
```

### **Permission Errors**
```json
{
  "status": "error",
  "message": "Insufficient permissions. Required: create:destinations",
  "code": 403
}
```

### **Validation Errors**
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "name": "Destination name is required"
  }
}
```

## **✅ Testing with Postman**

### **Setup**
1. Import the V2 Postman collection
2. Set environment variables:
   - `baseUrl`: http://localhost:3000
   - `apiVersion`: v2
   - `token`: (will be set after login)

### **Test Flow**
1. **Login as Admin**
   - Use `/api/v2/auth/login`
   - Token is automatically saved

2. **Test Public Access**
   - GET `/api/v2/destinations` (should work without token)
   - GET `/api/v2/destinations/:id` (should work without token)

3. **Test Protected Access**
   - POST `/api/v2/destinations` (requires token + permission)
   - PUT `/api/v2/destinations/:id` (requires token + permission)
   - DELETE `/api/v2/destinations/:id` (requires token + permission)

## **🔧 Implementation Example**

### **Frontend Integration**
```javascript
// Service class for destination management
class DestinationService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/api/v2/destinations';
  }

  // Public method - no auth required
  async getDestinations(params = {}) {
    return this.apiClient.get(this.baseUrl, { params });
  }

  // Protected method - requires auth
  async createDestination(data) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    
    return this.apiClient.post(this.baseUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  // Protected method - requires auth
  async updateDestination(id, data) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    
    return this.apiClient.put(`${this.baseUrl}/${id}`, formData);
  }

  // Protected method - requires auth
  async deleteDestination(id) {
    return this.apiClient.delete(`${this.baseUrl}/${id}`);
  }
}
```

## **📊 Response Formats**

### **Success Response**
```json
{
  "status": "success",
  "data": {
    "destination": {
      "_id": "12345",
      "name": "Beautiful Beach",
      "description": "A stunning beach destination",
      "location": "Maldives",
      "price": 1500,
      "images": ["image1.jpg", "image2.jpg"],
      "createdAt": "2025-01-21T10:00:00Z",
      "updatedAt": "2025-01-21T10:00:00Z"
    }
  },
  "message": "Destination created successfully"
}
```

### **List Response with Pagination**
```json
{
  "status": "success",
  "data": {
    "destinations": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

## **🔍 Debugging Tips**

1. **Check Token Validity**
   ```bash
   # Verify token is not expired
   GET /api/v2/auth/verify
   Authorization: Bearer <token>
   ```

2. **Check User Permissions**
   ```bash
   POST /api/v2/rbac/check-permission
   {
     "userId": "staff_id",
     "permission": "create:destinations"
   }
   ```

3. **View Assigned Role**
   ```bash
   GET /api/v2/staff/profile
   Authorization: Bearer <token>
   ```

## **📝 Notes**

- V2 uses cleaner middleware architecture
- All V2 routes are prefixed with `/api/v2`
- Authentication is handled by `AuthMiddleware`
- Permissions are handled by `PermissionMiddleware`
- File uploads are handled by the same `uploadFiles` middleware

---

**Version**: 2.0.0  
**Last Updated**: January 2025