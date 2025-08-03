# KeyTour RBAC System V2

A comprehensive Role-Based Access Control (RBAC) system built with Node.js, implementing enterprise-grade security, scalability, and maintainability following SOLID principles.

## 🎯 Features

### 🔐 Authentication & Security
- **JWT-based authentication** with access and refresh tokens
- **Token blacklisting** for secure logout
- **Session management** with device tracking
- **Rate limiting** protection
- **Password strength validation**
- **Account locking** after failed attempts

### 👥 Role-Based Access Control
- **Granular permissions** system with action:resource format
- **Dynamic role management**
- **Permission inheritance**
- **Resource-based authorization**
- **Bulk operations** support

### 🛡️ Security Features
- **Token rotation** for enhanced security
- **Security monitoring** and suspicious activity detection
- **Audit trail** for all operations
- **Input validation** and sanitization
- **CORS protection** with configurable policies

### 📊 Management & Monitoring
- **Staff management** with comprehensive CRUD operations
- **Session tracking** and management
- **Token analytics** and health monitoring
- **Automated cleanup** tasks
- **Performance optimization**

## 🏗️ Architecture

### Design Patterns
- **SOLID Principles** implementation
- **Clean Architecture** layers
- **Repository Pattern** for data access
- **Factory Pattern** for object creation
- **Observer Pattern** for event handling

### Project Structure
```
V2/
├── controllers/           # Request handlers
│   ├── AuthController.js
│   ├── StaffController.js
│   └── RBACController.js
├── middleware/           # Authentication & authorization
│   ├── authMiddleware.js
│   └── permissionMiddleware.js
├── models/              # Enhanced data models
│   ├── StaffModel.js
│   ├── RefreshTokenModel.js
│   └── TokenBlacklistModel.js
├── routes/              # API endpoints
│   ├── authRoutes.js
│   ├── staffRoutes.js
│   ├── rbacRoutes.js
│   └── index.js
├── services/            # Business logic
│   ├── AuthService.js
│   ├── RBACService.js
│   ├── StaffService.js
│   └── TokenManagementService.js
├── utils/               # Utilities
│   ├── validators.js
│   └── errorHandler.js
└── scripts/             # Setup & maintenance
    └── setup.js
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Environment Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/keytour

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_ISSUER=keytour-api
JWT_AUDIENCE=keytour-app

# Token Management
REFRESH_TOKEN_ROTATION=true

# Environment
NODE_ENV=development
```

### Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install bcryptjs jsonwebtoken validator mongoose helmet cors express-rate-limit node-cron
   ```

2. **Run Setup Script**
   ```bash
   node V2/scripts/setup.js
   ```
   This will:
   - Create default permissions and roles
   - Set up super admin account
   - Initialize token management
   - Run health checks

3. **Integration with Main App**
   ```javascript
   // In your main app.js
   const v2Routes = require('./V2/routes');
   app.use('/api/v2', v2Routes);
   ```

### **🚨 MongoDB Atlas Storage Issues?**

If you encounter **"storage quota exceeded"** errors:

```bash
# Quick fix: Run cleanup script
node V2/scripts/cleanup-database.js

# Space-efficient setup (saves 80% space)
node V2/scripts/minimal-setup.js
```

📖 **See full troubleshooting guide**: [`V2/MONGODB_TROUBLESHOOTING.md`](./MONGODB_TROUBLESHOOTING.md)

## 📚 API Documentation

### Authentication Endpoints

#### Login
```http
POST /api/v2/auth/login
Content-Type: application/json

{
  "email": "admin@keytour.com",
  "password": "yourpassword",
  "rememberMe": true
}
```

#### Refresh Token
```http
POST /api/v2/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Logout
```http
POST /api/v2/auth/logout
Authorization: Bearer your-access-token
```

### Staff Management

#### Get All Staff
```http
GET /api/v2/staff?page=1&limit=20&search=john&department=IT
Authorization: Bearer your-access-token
```

#### Create Staff
```http
POST /api/v2/staff
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@keytour.com",
  "password": "securepassword",
  "role": "role-id",
  "department": "IT",
  "employeeId": "EMP001",
  "position": "Developer"
}
```

### RBAC Management

#### Create Permission
```http
POST /api/v2/rbac/permissions
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "name": "create:tours",
  "description": "Permission to create tours"
}
```

#### Create Role
```http
POST /api/v2/rbac/roles
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "name": "Tour Manager",
  "description": "Manages tour operations",
  "permissions": ["create:tours", "read:tours", "update:tours"]
}
```

## 🔧 Configuration

### Middleware Usage

#### Basic Authentication
```javascript
const AuthMiddleware = require('./V2/middleware/authMiddleware');

// Require authentication
app.use('/protected', AuthMiddleware.requireAuth());

// Optional authentication
app.use('/public', AuthMiddleware.optionalAuth);
```

#### Permission-Based Authorization
```javascript
const PermissionMiddleware = require('./V2/middleware/permissionMiddleware');

// Require specific permissions
app.use('/admin', PermissionMiddleware.requirePermissions('create:staff', 'read:staff'));

// Resource-based permissions
app.use('/tours', PermissionMiddleware.requireResourcePermission('manage', 'tours'));
```

### Custom Validators
```javascript
const Validators = require('./V2/utils/validators');

// Validate staff data
const validation = Validators.validateStaffData(staffData);
if (!validation.isValid) {
  return res.status(400).json({ errors: validation.errors });
}
```

## 📊 Default Roles & Permissions

### Permissions
- **Staff Management**: `create:staff`, `read:staff`, `update:staff`, `delete:staff`
- **Role Management**: `create:roles`, `read:roles`, `update:roles`, `delete:roles`
- **Permission Management**: `create:permissions`, `read:permissions`, `update:permissions`, `delete:permissions`
- **Tours Management**: `create:tours`, `read:tours`, `update:tours`, `delete:tours`
- **Bookings Management**: `create:bookings`, `read:bookings`, `update:bookings`, `delete:bookings`
- **Users Management**: `read:users`, `update:users`, `block:users`
- **Reports & Analytics**: `read:reports`, `export:reports`
- **System Settings**: `read:settings`, `update:settings`

### Roles
- **Super Admin**: Full system access (all permissions)
- **Admin**: Administrative access (most permissions)
- **Manager**: Management level access (read/write for tours, bookings, users)
- **Customer Support**: Customer service access (read/update bookings and users)
- **Content Manager**: Content management access (tours and bookings)

## 🛠️ Maintenance & Monitoring

### Token Management
The system includes automated token maintenance:
- **Cleanup expired tokens** (hourly)
- **Remove old blacklisted tokens** (daily)
- **Generate analytics reports** (weekly)
- **Monitor suspicious activity** (every 6 hours)

### Health Monitoring
```http
GET /api/v2/auth/health
```
Returns system health status and capabilities.

### Token Analytics
```javascript
const TokenManagementService = require('./V2/services/TokenManagementService');

// Get token statistics
const stats = await TokenManagementService.getTokenStatistics();

// Get health report
const health = await TokenManagementService.getTokenHealthReport();
```

## 🔒 Security Best Practices

### Implemented Security Measures
- ✅ JWT token validation with blacklisting
- ✅ Refresh token rotation
- ✅ Rate limiting (IP and user-based)
- ✅ Password strength validation
- ✅ Account locking after failed attempts
- ✅ Input validation and sanitization
- ✅ CORS protection
- ✅ Security headers with Helmet.js
- ✅ Audit logging for security events

### Recommended Additional Measures
- 🔄 Implement 2FA (Two-Factor Authentication)
- 🔄 Add IP whitelisting for admin accounts
- 🔄 Implement CAPTCHA for login attempts
- 🔄 Add email notifications for security events
- 🔄 Implement session timeout warnings

## 🧪 Testing

### Manual Testing
1. **Authentication Flow**
   ```bash
   # Login
   curl -X POST http://localhost:3000/api/v2/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@keytour.com","password":"yourpassword"}'

   # Use returned token for protected endpoints
   curl -X GET http://localhost:3000/api/v2/staff \
     -H "Authorization: Bearer your-access-token"
   ```

2. **Permission Testing**
   - Create staff with different roles
   - Test access to various endpoints
   - Verify permission enforcement

### Load Testing
```bash
# Test authentication endpoint
ab -n 1000 -c 10 -H "Content-Type: application/json" \
  -p login.json http://localhost:3000/api/v2/auth/login
```

## 📈 Performance Optimization

### Implemented Optimizations
- **Permission caching** (5-minute TTL)
- **Database indexing** on frequently queried fields
- **Pagination** for large data sets
- **Efficient token cleanup** processes
- **Connection pooling** for database operations

### Monitoring Metrics
- Token creation/revocation rates
- Permission check performance
- Database query execution time
- Memory usage patterns
- Error rates by endpoint

## 🤝 Contributing

### Code Style
- Follow ESLint configuration
- Use meaningful variable names
- Add JSDoc comments for functions
- Follow SOLID principles

### Pull Request Process
1. Create feature branch
2. Implement changes with tests
3. Update documentation
4. Submit pull request with description

## 📝 Changelog

### Version 2.0.0
- ✅ Complete RBAC system implementation
- ✅ Enhanced JWT authentication
- ✅ Token management with refresh tokens
- ✅ Comprehensive middleware system
- ✅ Advanced security features
- ✅ Automated setup and maintenance
- ✅ Full API documentation

## 📞 Support

### Common Issues

**Q: Token expired error**
A: Implement token refresh mechanism in your client application.

**Q: Permission denied error**
A: Verify user has required role/permissions assigned.

**Q: Database connection issues**
A: Check MongoDB URI and network connectivity.

### Getting Help
- Review this documentation
- Check the setup script logs
- Examine error logs in application
- Contact the development team

## 📄 License

This RBAC system is part of the KeyTour project. All rights reserved.

---

**Built with ❤️ for KeyTour Platform**

*Follow SOLID principles • Write clean code • Secure by design*