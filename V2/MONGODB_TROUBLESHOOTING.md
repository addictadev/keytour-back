# MongoDB Atlas Storage Quota Troubleshooting Guide

## 🚨 **Problem**: Storage Quota Exceeded

**Error Message:**
```
MongoServerError: you are over your space quota, using 512 MB of 512 MB
```

This error occurs when your MongoDB Atlas Free Tier cluster reaches its **512 MB storage limit**.

---

## 🔧 **Solution Options**

### **Option 1: Database Cleanup** ⭐ *Recommended*

#### **Quick Cleanup Script**
```bash
# Run the automated cleanup tool
node V2/scripts/cleanup-database.js
```

This script will:
- Analyze your database usage
- Identify large collections
- Provide cleanup options
- Free up storage space

#### **Manual Cleanup Steps**
1. **Identify Large Collections**
   ```javascript
   // In MongoDB Compass or shell
   db.stats()
   db.runCommand({listCollections: 1})
   ```

2. **Common Space Consumers** (check these first):
   - **`uploads/images`** - Usually the largest
   - **`logs`** - Can grow very large
   - **`sessions`** - Temporary data
   - **`notifications`** - Historical data

3. **Clean Up Images/Files**
   ```javascript
   // Remove large files (be careful!)
   db.uploads.deleteMany({})
   db.getCollection('fs.files').deleteMany({})
   db.getCollection('fs.chunks').deleteMany({})
   ```

4. **Remove Test Data**
   ```javascript
   // Remove test/demo data
   db.users.deleteMany({email: /test|demo|example/i})
   db.tours.deleteMany({title: /test|demo|sample/i})
   ```

### **Option 2: Minimal RBAC Setup** 🎯

Use the space-efficient setup script:

```bash
# Run minimal setup (saves 80% space)
node V2/scripts/minimal-setup.js
```

**What it creates:**
- ✅ 5 core permissions (instead of 25)
- ✅ 2 essential roles (instead of 5)  
- ✅ 1 super admin account
- ✅ Basic functionality ready

### **Option 3: Use Local MongoDB** 🏠

#### **Install MongoDB Locally**
```bash
# Windows (with Chocolatey)
choco install mongodb

# macOS (with Homebrew)
brew install mongodb-community

# Ubuntu/Debian
sudo apt install mongodb

# Start MongoDB
mongod --dbpath ./data
```

#### **Update Connection String**
```bash
# In your .env file
MONGODB_URI=mongodb://localhost:27017/keytour
```

### **Option 4: Upgrade MongoDB Atlas** 💳

#### **Atlas Pricing Tiers**
- **M0 (Free)**: 512 MB storage
- **M2 (Shared)**: $9/month, 2 GB storage
- **M5 (Dedicated)**: $57/month, 5 GB storage

#### **Upgrade Steps**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Select your cluster
3. Click "Edit Configuration"
4. Choose a paid tier
5. Confirm upgrade

### **Option 5: Alternative Database Setups**

#### **A. MongoDB Atlas with Multiple Free Clusters**
- Create separate clusters for different environments
- Dev cluster, Prod cluster, Test cluster
- Each gets 512 MB

#### **B. Use Railway/Render MongoDB**
- Railway: $5/month for 1GB
- Render: $7/month for 1GB
- Similar pricing to Atlas M2

#### **C. Self-hosted Cloud Solutions**
- DigitalOcean Droplet: $6/month
- AWS EC2 Free Tier: 750 hours/month
- Google Cloud VM: $10/month credit

---

## 📊 **Database Space Optimization Tips**

### **1. Image Storage Optimization**
```javascript
// Move images to external storage
const cloudinary = require('cloudinary');
const aws = require('aws-sdk');

// Instead of storing in MongoDB:
// ❌ { image: "base64_large_image_data..." }

// Store externally:
// ✅ { imageUrl: "https://cloudinary.com/image/123" }
```

### **2. Data Archiving Strategy**
```javascript
// Archive old data
const archiveDate = new Date();
archiveDate.setMonth(archiveDate.getMonth() - 6);

// Move to archive collection
db.bookings_archive.insertMany(
  db.bookings.find({createdAt: {$lt: archiveDate}})
);
db.bookings.deleteMany({createdAt: {$lt: archiveDate}});
```

### **3. Index Optimization**
```javascript
// Remove unused indexes
db.collection.getIndexes()
db.collection.dropIndex("index_name")

// Use compound indexes
db.users.createIndex({email: 1, status: 1}) // Instead of separate indexes
```

### **4. Document Structure Optimization**
```javascript
// ❌ Embedded large arrays
{
  user: "john",
  logs: [/* 1000+ log entries */]
}

// ✅ Reference pattern
{
  user: "john",
  logCount: 1000
}
// Separate logs collection
```

---

## 🔍 **Monitoring & Prevention**

### **1. Set Up Monitoring**
```javascript
// Add to your app
const mongoose = require('mongoose');

// Monitor database size
setInterval(async () => {
  const stats = await mongoose.connection.db.stats();
  const usagePercent = (stats.storageSize / (512 * 1024 * 1024)) * 100;
  
  if (usagePercent > 80) {
    console.warn(`Database usage: ${usagePercent.toFixed(1)}%`);
    // Send alert
  }
}, 3600000); // Check every hour
```

### **2. Implement Data Retention Policies**
```javascript
// Auto-cleanup old data
const cleanupOldData = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  // Clean temporary data
  await TempFiles.deleteMany({createdAt: {$lt: thirtyDaysAgo}});
  await Sessions.deleteMany({expiresAt: {$lt: new Date()}});
  await Notifications.deleteMany({
    read: true,
    createdAt: {$lt: thirtyDaysAgo}
  });
};

// Run daily
setInterval(cleanupOldData, 24 * 60 * 60 * 1000);
```

### **3. Implement File Size Limits**
```javascript
// Limit upload sizes
const multer = require('multer');
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// Compress images before storing
const sharp = require('sharp');
const compressedBuffer = await sharp(imageBuffer)
  .resize(800, 600)
  .jpeg({quality: 80})
  .toBuffer();
```

---

## 🚀 **Quick Recovery Steps**

### **Immediate Actions (5 minutes)**
```bash
# 1. Run cleanup script
node V2/scripts/cleanup-database.js

# 2. If still issues, run minimal setup
node V2/scripts/minimal-setup.js

# 3. Test basic functionality
node V2/scripts/health-check.js
```

### **Short-term Solutions (30 minutes)**
1. **Move to local MongoDB** for development
2. **Set up external file storage** (Cloudinary, AWS S3)
3. **Implement data archiving** for old records
4. **Optimize database indexes**

### **Long-term Solutions (Planning)**
1. **Upgrade MongoDB Atlas** to paid tier
2. **Implement proper data lifecycle** management
3. **Set up monitoring** and alerts
4. **Design for scalability** from the start

---

## 📞 **Still Having Issues?**

### **Common Problems & Solutions**

#### **Problem**: Cleanup script fails
**Solution**: 
```bash
# Check database connection
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(console.error)"

# Check available space
mongo "your-connection-string" --eval "db.stats()"
```

#### **Problem**: Can't connect to database
**Solution**:
1. Check MongoDB Atlas IP whitelist
2. Verify connection string format
3. Check network connectivity

#### **Problem**: Still out of space after cleanup
**Solution**:
1. Use local MongoDB for development
2. Upgrade to Atlas M2 tier ($9/month)
3. Use minimal setup with core features only

### **Getting Help**
1. **Check MongoDB Atlas docs**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
2. **MongoDB Community Forums**: [community.mongodb.com](https://community.mongodb.com)
3. **Stack Overflow**: Tag `mongodb-atlas`

---

## ✅ **Success Checklist**

After resolving the storage issue:

- [ ] Database connection working
- [ ] RBAC system initialized (minimal or full)
- [ ] Super admin account created
- [ ] Basic authentication working
- [ ] Monitoring implemented
- [ ] Data retention policies set
- [ ] External file storage configured
- [ ] Regular cleanup scheduled

---

**💡 Pro Tip**: Always start with the minimal setup for development, then expand as needed. This approach saves space and allows you to test the core functionality before building out the full system.