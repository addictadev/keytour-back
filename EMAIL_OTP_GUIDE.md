# Email OTP Implementation Guide

## Overview

This guide documents the enhanced email OTP (One-Time Password) system implemented in the KeyTour application. The system provides secure user authentication with features like device tracking, suspicious login detection, rate limiting, and professional email templates.

## Features

### 1. **Email-Based OTP Delivery**
- Professional, branded HTML email templates
- Support for multiple OTP purposes (verification, login, password reset, suspicious login)
- Masked email display for security (e.g., `joh***n@gmail.com`)

### 2. **Device Tracking & Trust**
- Automatic device fingerprinting
- Location detection based on IP
- Trust levels: trusted, suspicious, blocked
- 30-day trust expiration

### 3. **Suspicious Login Detection**
- New device detection
- Unusual location detection (>1000km from previous logins)
- Automatic OTP requirement for suspicious activities

### 4. **Security Features**
- Rate limiting (max 3 OTPs per 15-minute window)
- Progressive blocking (5, 15, 60, 240 minutes)
- 30-second cooldown between OTP requests
- Maximum 5 consecutive failed attempts
- OTP expiration (default 5 minutes)

### 5. **Professional Email Templates**
- Branded design with placeholder logo
- Responsive layout
- Clear security notices
- Device information display for suspicious logins

## Installation

1. **Install required dependencies:**
```bash
npm install ua-parser-js geoip-lite
```

2. **Set up environment variables:**
```env
SENDGRID_API_KEY=your_sendgrid_api_key
OTP_EXPIRY=5  # OTP expiry in minutes
NODE_ENV=development  # or production
```

## Architecture

### Models

1. **DeviceTrustModel.js**
   - Tracks user devices
   - Manages trust levels
   - Stores device information and location

2. **OTPAttemptModel.js**
   - Tracks OTP attempts
   - Implements rate limiting
   - Manages blocking logic

3. **OTPModel.js** (Enhanced)
   - Stores OTP codes
   - Tracks purpose and device fingerprint
   - Auto-expires using MongoDB TTL

### Services

1. **otpService.js** (Enhanced)
   - Generates and sends OTPs via email
   - Implements rate limiting
   - Manages device trust
   - Handles suspicious login detection

2. **emailService.js** (Enhanced)
   - Professional email templates
   - Suspicious login alerts
   - Email masking utility

3. **deviceDetector.js** (New)
   - Extracts device information
   - Detects location from IP
   - Calculates distance between locations

### API Endpoints

1. **Registration with OTP**
   ```
   POST /api/auth/register
   Body: { name, email, password, phone }
   Response: { user, otp: { sent, email, expiresIn } }
   ```

2. **Login with Suspicious Device Detection**
   ```
   POST /api/auth/login
   Body: { email, password, fcmtoken }
   Response: 
   - Normal: { user, token }
   - Suspicious: { requiresOTP: true, reason, user, otp, deviceInfo }
   ```

3. **Verify Login OTP**
   ```
   POST /api/auth/verify-login-otp
   Body: { userId, otp, fcmtoken }
   Response: { user, token }
   ```

4. **Resend OTP**
   ```
   POST /api/auth/resend-otp
   Body: { userId, purpose }
   Response: { email, sent, expiresIn }
   ```

## Usage Examples

### 1. Registration Flow
```javascript
// 1. User registers
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+1234567890"
}

// Response
{
  "user": {
    "_id": "...",
    "email": "john@example.com",
    "name": "John Doe",
    "isVerified": false
  },
  "otp": {
    "sent": true,
    "email": "joh***@example.com",
    "expiresIn": 300
  }
}

// 2. User verifies OTP
POST /api/auth/verify-otp
{
  "userId": "john@example.com",
  "otp": "123456"
}
```

### 2. Login with Suspicious Device
```javascript
// 1. User attempts login from new device
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "securePassword123",
  "fcmtoken": "..."
}

// Response (suspicious login detected)
{
  "requiresOTP": true,
  "reason": "new_device",
  "user": {
    "_id": "...",
    "email": "joh***@example.com"
  },
  "otp": {
    "sent": true,
    "email": "joh***@example.com",
    "expiresIn": 300
  },
  "deviceInfo": {
    "browser": "Chrome",
    "os": "Windows",
    "location": "New York, NY, United States"
  }
}

// 2. User verifies OTP
POST /api/auth/verify-login-otp
{
  "userId": "...",
  "otp": "789012",
  "fcmtoken": "..."
}
```

## Testing

Run email tests:
```bash
# Test all email templates
npm run test:email

# Test specific templates
npm run test:email otp
npm run test:email suspicious

# Available test types:
# - basic: Basic email functionality
# - otp: OTP email template
# - suspicious: Suspicious login email
# - booking: Booking confirmation
# - vendor: Vendor notification
# - acceptance: Vendor acceptance
```

## Email Template Customization

### Replace Logo
In `src/utils/emailService.js`, find and replace:
```html
<img src="https://placeholder-logo.com/keytour-logo.png" alt="KeyTour" ...>
```

With your actual logo URL or base64 encoded image.

### Customize Colors
The templates use these primary colors:
- Primary Blue: `#2B6CB0`
- Dark Blue: `#2C5282`
- Alert Red: `#E53E3E`
- Success Green: `#28a745`

### Modify Support Email
Replace `support@keytour.com` with your actual support email.

## Security Best Practices

1. **Environment Variables**
   - Never commit API keys
   - Use different keys for dev/prod
   - Rotate keys regularly

2. **Rate Limiting**
   - Adjust limits based on your needs
   - Monitor for abuse patterns
   - Implement IP-based blocking for severe abuse

3. **Device Trust**
   - Review trust expiration period
   - Implement device management UI
   - Allow users to revoke device trust

4. **OTP Security**
   - Use secure random generation
   - Store only hashed OTPs in production
   - Implement OTP reuse prevention

## Monitoring

1. **Track Failed Attempts**
   ```javascript
   // Find users with high failure rates
   const suspiciousAttempts = await OTPAttempt.find({
     failedAttempts: { $gte: 3 },
     lastAttemptAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
   });
   ```

2. **Monitor Blocked Users**
   ```javascript
   const blockedUsers = await OTPAttempt.find({
     isBlocked: true,
     blockedUntil: { $gte: new Date() }
   });
   ```

3. **Device Trust Analytics**
   ```javascript
   const untrustedDevices = await DeviceTrust.find({
     trustLevel: 'suspicious',
     loginCount: { $gte: 5 }
   });
   ```

## Cleanup Jobs

Add these to your cron scheduler:

```javascript
// Clean expired OTPs (runs automatically via TTL)
// Clean old OTP attempts (monthly)
await OTPAttempt.cleanupOldRecords();

// Clean expired device trust (monthly)
await DeviceTrust.cleanupExpiredDevices();
```

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Check SendGrid API key
   - Verify sender email is verified in SendGrid
   - Check SendGrid account limits

2. **OTP expired too quickly**
   - Adjust `OTP_EXPIRY` environment variable
   - Check server time synchronization

3. **Rate limiting too strict**
   - Modify constants in `OTPAttemptModel.js`
   - Adjust window duration and max attempts

4. **Location detection not working**
   - Update geoip-lite database: `npm run updatedb`
   - Check if running behind proxy (use proper headers)

## Future Enhancements

1. **Two-Factor Authentication (2FA)**
   - Add user preference for 2FA
   - Support authenticator apps
   - Backup codes

2. **Advanced Security**
   - Implement CAPTCHA for repeated failures
   - Machine learning for anomaly detection
   - Risk-based authentication

3. **User Experience**
   - SMS fallback option
   - Voice call OTP delivery
   - Magic link authentication

4. **Analytics**
   - OTP delivery success rates
   - Device trust patterns
   - Geographic login distribution