const express = require('express');
const VendorController = require('../controllers/vendorController');
const validateRequest = require('../middlewares/validateRequest');
const vendorValidator = require('../validators/vendorValidator');
const AdminController = require('../controllers/adminController');
const AuthMiddleware = require('../../V2/middleware/authMiddleware');
const PermissionMiddleware = require('../../V2/middleware/permissionMiddleware');
const router = express.Router();
const uploadFiles = require('../middlewares/upload');

// Route to create a vendor with image and thumbnail upload
router.post('/', uploadFiles, VendorController.createVendor);


router.use(AuthMiddleware.requireAuth({
    requireEmailVerification: false,
    validateSession: true,
    allowedUserTypes: ['staff']
}));

router.patch('/:vendorId/status',PermissionMiddleware.attachPermissionInfo, PermissionMiddleware.requirePermissions('read:permissions', 'read:roles'), VendorController.updateVendorStatus);
// router.post('/', vendorValidator, validateRequest, VendorController.createVendor);
router.get('/:id', VendorController.getVendorById);
router.get('/',PermissionMiddleware.attachPermissionInfo,PermissionMiddleware.requirePermissions('read:permissions', 'read:roles'), VendorController.getAllVendors);
router.put('/:id',  VendorController.updateVendor);
router.delete('/:id',PermissionMiddleware.attachPermissionInfo, PermissionMiddleware.requirePermissions('read:permissions', 'read:roles'), VendorController.deleteVendor);

module.exports = router;
