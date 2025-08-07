# Vendor API Documentation

## Overview
This document provides comprehensive documentation for all vendor-related API endpoints in the KeyTour application. The vendor system allows businesses to register, get approved, and manage tours on the platform.

## Base URL
```
http://localhost:5000/api/vendors
```

## Authentication
Most vendor endpoints require authentication via JWT token. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

For vendor-specific operations, include role in headers:
```
role: vendor
```

---

## 1. Vendor Registration

### POST `/api/vendors`
Register a new vendor account with pending status.

**Headers:**
```
Content-Type: multipart/form-data
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Vendor's full name |
| email | string | Yes | Vendor's email address (unique) |
| password | string | Yes | Account password |
| company_name | string | Yes | Company/Business name |
| company_address | string | Yes | Company address |
| phone | string | Yes | Contact phone number |
| bank | string | Yes | Bank name |
| bank_account | string | Yes | Bank account number |
| image | file | Yes | Company logo/profile image |
| imagesthubnails | file[] | Yes | Multiple thumbnail images |

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Vendor created successfully",
  "data": {
    "_id": "65abc123def456",
    "name": "John Doe",
    "email": "vendor@example.com",
    "company_name": "Adventure Tours Ltd",
    "company_address": "123 Main St, City",
    "image": "uploads/images/image-123456.jpeg",
    "imagesthubnails": ["uploads/images/thumb1.jpeg", "uploads/images/thumb2.jpeg"],
    "bank": "Bank of America",
    "bank_account": "****1234",
    "defaultrole": "vendor",
    "status": "pending",
    "isBlocked": false,
    "commission": 15,
    "phone": "+1234567890",
    "tours": [],
    "created_at": "2024-01-15T10:00:00.000Z"
  }
}
```

**Email Notification:**
- A welcome email is automatically sent to the vendor upon successful registration
- Email includes application details and next steps

---

## 2. Vendor Login

### POST `/api/auth/login`
Authenticate vendor and receive JWT token.

**Headers:**
```
Content-Type: application/json
role: vendor
```

**Request Body:**
```json
{
  "email": "vendor@example.com",
  "password": "yourpassword",
  "fcmtoken": "optional_fcm_token_for_notifications"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "65abc123def456",
      "name": "John Doe",
      "email": "vendor@example.com",
      "company_name": "Adventure Tours Ltd",
      "status": "accepted",
      "defaultrole": "vendor",
      "commission": 15
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Cases:**
- **401 Unauthorized**: Invalid credentials
- **401 Unauthorized**: `"still pending"` - Account pending approval
- **401 Unauthorized**: `"rejected"` - Account rejected
- **403 Forbidden**: `"User is blocked"` - Account blocked

---

## 3. Get Vendor by ID

### GET `/api/vendors/:id`
Retrieve specific vendor details.

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <token>
role: admin (optional - for additional statistics)
```

**URL Parameters:**
- `id` - Vendor ID

**Response (200 OK):**

**Standard Response (Non-Admin):**
```json
{
  "success": true,
  "message": "Vendor retrieved successfully",
  "data": {
    "_id": "65abc123def456",
    "name": "John Doe",
    "email": "vendor@example.com",
    "company_name": "Adventure Tours Ltd",
    "company_address": "123 Main St",
    "status": "accepted",
    "commission": 15,
    "tours": ["tour_id_1", "tour_id_2"]
  }
}
```

**Admin Response (with statistics):**
```json
{
  "success": true,
  "message": "Vendor retrieved successfully",
  "data": {
    "_id": "65abc123def456",
    "name": "John Doe",
    "email": "vendor@example.com",
    "company_name": "Adventure Tours Ltd",
    "tourStatusCount": {
      "pending": 2,
      "accepted": 10,
      "rejected": 1
    },
    "bookingStatusCount": {
      "pending": 5,
      "confirmed": 25,
      "cancelled": 3,
      "canceledbyvendor": 1,
      "fullcapacity": 2
    },
    "averageRating": 4.5,
    "reviewCount": 45,
    "totalConfirmedRevenue": 15000
  }
}
```

---

## 4. Get All Vendors

### GET `/api/vendors`
Retrieve list of all vendors with filtering and pagination.

**Authentication Required:** Yes  
**Permissions Required:** `read:permissions`, `read:roles`

**Query Parameters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| status | string | Filter by status | `?status=accepted` |
| page | number | Page number | `?page=2` |
| limit | number | Items per page | `?limit=10` |
| sort | string | Sort field | `?sort=-created_at` |
| fields | string | Select specific fields | `?fields=name,email,status` |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Tours retrieved successfully",
  "data": [
    {
      "_id": "65abc123def456",
      "name": "John Doe",
      "email": "vendor@example.com",
      "company_name": "Adventure Tours Ltd",
      "status": "accepted"
    }
  ],
  "meta": {
    "results": 10,
    "counts": 50,
    "pendingCount": 5,
    "acceptedCount": 40,
    "rejectedCount": 5
  }
}
```

---

## 5. Update Vendor Status (Admin Only)

### PATCH `/api/vendors/:vendorId/status`
Approve or reject vendor application.

**Authentication Required:** Yes  
**Permissions Required:** `read:permissions`, `read:roles`

**URL Parameters:**
- `vendorId` - Vendor ID

**Request Body:**
```json
{
  "status": "accepted"  // or "rejected"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Vendor accepted successfully",
  "data": {
    "_id": "65abc123def456",
    "name": "John Doe",
    "status": "accepted"
  }
}
```

**Email Notifications:**
- **Accepted**: Sends welcome email with login instructions
- **Rejected**: Sends rejection notification

**Error Cases:**
- **400 Bad Request**: Invalid status value
- **404 Not Found**: Vendor not found

---

## 6. Update Vendor

### PUT `/api/vendors/:id`
Update vendor information.

**Authentication Required:** Yes

**URL Parameters:**
- `id` - Vendor ID

**Request Body:**
```json
{
  "name": "Updated Name",
  "company_address": "New Address",
  "phone": "+9876543210",
  "commission": 20
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Vendor updated successfully",
  "data": {
    "_id": "65abc123def456",
    "name": "Updated Name",
    "company_address": "New Address"
  }
}
```

---

## 7. Delete Vendor (Admin Only)

### DELETE `/api/vendors/:id`
Delete vendor and all associated data.

**Authentication Required:** Yes  
**Permissions Required:** `read:permissions`, `read:roles`

**URL Parameters:**
- `id` - Vendor ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Vendor deleted successfully",
  "data": null
}
```

**Important Notes:**
- Deletes vendor account
- Removes all associated tours
- Removes all associated bookings
- This action is irreversible

---

## Error Responses

All endpoints may return these common error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "field": "Error message"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Vendor not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Vendor Status Flow

```
Registration → Pending → Admin Review → Accepted/Rejected
                  ↓                          ↓
            Welcome Email            Approval/Rejection Email
                                            ↓
                                    Can Login (if accepted)
```

## Vendor Permissions

| Status | Can Login | Can Create Tours | Can Manage Bookings |
|--------|-----------|------------------|---------------------|
| Pending | No | No | No |
| Accepted | Yes | Yes | Yes |
| Rejected | No | No | No |
| Blocked | No | No | No |

---

## Rate Limiting
- Registration: 5 requests per hour per IP
- Login: 10 attempts per hour per email
- API calls: 100 requests per minute per token

## Security Notes
1. All passwords are hashed before storage
2. JWT tokens expire after 7 days
3. File uploads are validated for type and size
4. SQL injection protection via parameterized queries
5. XSS protection through input sanitization

## Testing with Postman

Import the following collection structure:

```
KeyTour API
├── Vendor
│   ├── Register Vendor
│   ├── Login Vendor
│   ├── Get Vendor by ID
│   ├── Get All Vendors
│   ├── Update Vendor Status
│   ├── Update Vendor
│   └── Delete Vendor
```

Set environment variables:
- `base_url`: http://localhost:5000
- `vendor_token`: (set after login)
- `admin_token`: (for admin operations)
- `vendor_id`: (for testing specific vendor)

---

## Contact & Support
For API support or issues, contact: support@keytour.com

## Version
API Version: 1.0.0  
Last Updated: January 2024
