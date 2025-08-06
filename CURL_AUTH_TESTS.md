# Authentication CURL Test Collection

## Environment Variables
```bash
# Set your API base URL
API_BASE="http://localhost:3000/api/auth"

# Set a test email
TEST_EMAIL="testuser@example.com"
```

## 1. User Registration

### Register New User
```bash
curl -X POST "$API_BASE/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "'$TEST_EMAIL'",
    "password": "Test@123456",
    "phone": "+1234567890"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "testuser@example.com",
      "name": "Test User",
      "isVerified": false
    },
    "otp": {
      "sent": true,
      "email": "tes***@example.com",
      "expiresIn": 300
    }
  },
  "message": "User registered successfully. Please check your email for OTP verification."
}
```

## 2. Verify Registration OTP

### Verify OTP After Registration
```bash
curl -X POST "$API_BASE/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$TEST_EMAIL'",
    "otp": "123456"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "testuser@example.com",
    "name": "Test User",
    "isVerified": true
  },
  "message": "OTP verified successfully"
}
```

## 3. Normal Login (Trusted Device)

### Login from Trusted Device
```bash
curl -X POST "$API_BASE/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "password": "Test@123456",
    "fcmtoken": "dummy-fcm-token"
  }'
```

**Expected Response (Trusted Device):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "testuser@example.com",
      "name": "Test User"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "Login successful"
}
```

## 4. Suspicious Login (New Device)

### Login from New/Suspicious Device
```bash
curl -X POST "$API_BASE/login" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "password": "Test@123456",
    "fcmtoken": "new-device-fcm-token"
  }'
```

**Expected Response (Suspicious Login):**
```json
{
  "success": true,
  "data": {
    "requiresOTP": true,
    "reason": "new_device",
    "user": {
      "_id": "...",
      "email": "tes***@example.com"
    },
    "otp": {
      "sent": true,
      "email": "tes***@example.com",
      "expiresIn": 300
    },
    "deviceInfo": {
      "browser": "Mobile Safari",
      "os": "iOS",
      "location": "New York, NY, United States"
    }
  },
  "message": "New device detected. Verification code sent to your email."
}
```

## 5. Verify Login OTP (Suspicious Login)

### Complete Suspicious Login with OTP
```bash
# Save the user ID from previous response
USER_ID="<user_id_from_previous_response>"

curl -X POST "$API_BASE/verify-login-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$USER_ID'",
    "otp": "789012",
    "fcmtoken": "new-device-fcm-token"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "testuser@example.com",
      "name": "Test User"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "Login successful"
}
```

## 6. Forgot Password

### Request Password Reset OTP
```bash
curl -X POST "$API_BASE/forget-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "email": "tes***@example.com",
    "sent": true,
    "expiresIn": 300,
    "user": {
      "_id": "...",
      "email": "tes***@example.com"
    }
  },
  "message": "OTP sent to tes***@example.com for password reset"
}
```

## 7. Reset Password

### Reset Password with OTP
```bash
curl -X POST "$API_BASE/reset-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "otp": "456789",
    "newPassword": "NewPassword@123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "testuser@example.com",
    "name": "Test User"
  },
  "message": "Password reset successfully"
}
```

## 8. Resend OTP

### Resend OTP (Rate Limited)
```bash
curl -X POST "$API_BASE/resend-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$USER_ID'",
    "purpose": "verification"
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "data": {
    "email": "tes***@example.com",
    "sent": true,
    "expiresIn": 300
  },
  "message": "OTP resent successfully. Please check your email."
}
```

**Expected Response (Rate Limited):**
```json
{
  "success": false,
  "error": "Please wait before requesting another OTP. Please wait 25 seconds."
}
```

## 9. Admin Login

### Admin Login
```bash
curl -X POST "$API_BASE/login" \
  -H "Content-Type: application/json" \
  -H "role: admin" \
  -d '{
    "email": "admin@keytour.com",
    "password": "AdminPassword@123",
    "fcmtoken": "admin-fcm-token"
  }'
```

## 10. Vendor Login

### Vendor Login
```bash
curl -X POST "$API_BASE/login" \
  -H "Content-Type: application/json" \
  -H "role: vendor" \
  -d '{
    "email": "vendor@example.com",
    "password": "VendorPassword@123",
    "fcmtoken": "vendor-fcm-token"
  }'
```

## 11. Block/Unblock User (Admin Only)

### Block User
```bash
# First login as admin to get token
ADMIN_TOKEN="<admin_jwt_token>"
USER_TO_BLOCK="<user_id>"

curl -X PUT "$API_BASE/block/$USER_TO_BLOCK" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## 12. Logout

### Logout User
```bash
USER_TOKEN="<user_jwt_token>"

curl -X POST "$API_BASE/logout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN"
```

## Testing Scenarios

### 1. Test Rate Limiting
```bash
# Try to request OTP multiple times quickly
for i in {1..5}; do
  echo "Attempt $i:"
  curl -X POST "$API_BASE/resend-otp" \
    -H "Content-Type: application/json" \
    -d '{
      "userId": "'$USER_ID'"
    }'
  echo -e "\n"
  sleep 2
done
```

### 2. Test Invalid OTP
```bash
# Try wrong OTP multiple times to trigger blocking
for i in {1..6}; do
  echo "Attempt $i with wrong OTP:"
  curl -X POST "$API_BASE/verify-otp" \
    -H "Content-Type: application/json" \
    -d '{
      "userId": "'$TEST_EMAIL'",
      "otp": "000000"
    }'
  echo -e "\n"
done
```

### 3. Test Expired OTP
```bash
# Wait for 6 minutes after OTP generation, then try to verify
echo "Waiting for OTP to expire (6 minutes)..."
sleep 360
curl -X POST "$API_BASE/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$TEST_EMAIL'",
    "otp": "123456"
  }'
```

## Notes

1. **Development Mode**: In development, OTP might be returned in the response. In production, it will only be sent via email.

2. **Headers**:
   - `role`: Used to specify admin/vendor login (omit for regular users)
   - `User-Agent`: Used for device detection
   - `Authorization`: Required for authenticated endpoints

3. **Rate Limiting**:
   - 30-second cooldown between OTP requests
   - Maximum 3 OTPs per 15-minute window
   - 5 consecutive failed attempts trigger blocking

4. **Device Trust**:
   - Devices are marked as trusted after successful OTP verification
   - Trust expires after 30 days
   - New devices always require OTP verification

5. **Email Masking**:
   - Emails are masked in responses for security (e.g., `tes***@example.com`)

## Environment-Specific Testing

### Local Development
```bash
API_BASE="http://localhost:3000/api/auth"
```

### Staging
```bash
API_BASE="https://staging-api.keytour.com/api/auth"
```

### Production
```bash
API_BASE="https://api.keytour.com/api/auth"
```