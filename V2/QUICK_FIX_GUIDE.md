# 🚨 **Quick Fix for MongoDB Storage Quota Error**

## **Your Problem**
MongoDB Atlas Free Tier (512 MB) is full, causing RBAC setup to fail.

---

## **⚡ Quick Solutions (Pick One)**

### **Option 1: Free Up Space** ⭐ *Recommended*
```bash
# Run automated cleanup
node V2/scripts/cleanup-database.js
```
**What it does**: Analyzes your database and removes unnecessary data

### **Option 2: Minimal Setup** 🎯 *Fast*
```bash
# Use space-efficient setup
node V2/scripts/minimal-setup.js
```
**What it creates**: 
- ✅ 5 core permissions (vs 25 full)
- ✅ 2 roles (vs 5 full)
- ✅ Super admin account
- ✅ 80% less database space used

### **Option 3: Use Local MongoDB** 🏠 *Best for Dev*
```bash
# 1. Install MongoDB locally
# Windows: choco install mongodb
# Mac: brew install mongodb-community
# Ubuntu: sudo apt install mongodb

# 2. Start MongoDB
mongod --dbpath ./data

# 3. Update connection string
# In .env: MONGODB_URI=mongodb://localhost:27017/keytour
```

### **Option 4: Upgrade Atlas** 💳 *Production Ready*
- MongoDB Atlas M2: $9/month, 2GB storage
- Go to [MongoDB Atlas](https://cloud.mongodb.com) → Edit Configuration

---

## **🎯 Test the Fix**

After choosing a solution:

```bash
# 1. Test database connection
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('✅ Connected')).catch(console.error)"

# 2. Run RBAC setup (if using cleanup/local MongoDB)
node V2/scripts/setup.js

# 3. Test the API
curl http://localhost:3000/api/v2/health
```

---

## **🔍 What Caused This**

**Likely culprits taking up space:**
1. **Image uploads** in `/uploads` folder (usually 80%+ of space)
2. **Log files** and temporary data
3. **Test/demo data** from development
4. **Large text fields** or embedded documents

---

## **💡 Prevention Tips**

1. **Use external image storage**:
   ```javascript
   // Instead of storing images in MongoDB
   // Use Cloudinary, AWS S3, or similar
   ```

2. **Regular cleanup**:
   ```javascript
   // Auto-delete old temporary data
   setInterval(cleanupOldData, 24 * 60 * 60 * 1000);
   ```

3. **Monitor usage**:
   ```javascript
   // Check database size regularly
   const stats = await mongoose.connection.db.stats();
   console.log('Usage:', (stats.storageSize / (512 * 1024 * 1024) * 100).toFixed(1) + '%');
   ```

---

## **🆘 Still Having Issues?**

1. **Check connection**: Verify your MongoDB URI is correct
2. **IP Whitelist**: Ensure your IP is whitelisted in Atlas
3. **Manual cleanup**: Delete large collections manually
4. **Contact support**: For persistent issues

📖 **Full troubleshooting guide**: [`MONGODB_TROUBLESHOOTING.md`](./MONGODB_TROUBLESHOOTING.md)

---

## **✅ Success Checklist**

- [ ] Database space issue resolved
- [ ] RBAC system setup completed
- [ ] Can login with super admin
- [ ] API endpoints working
- [ ] Postman collection ready for testing

**Next**: Import the Postman collection from `/V2/postman/` to test all endpoints!