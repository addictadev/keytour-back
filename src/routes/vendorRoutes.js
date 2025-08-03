const express = require('express');
const VendorController = require('../controllers/vendorController');
const validateRequest = require('../middlewares/validateRequest');
const vendorValidator = require('../validators/vendorValidator');
const AdminController = require('../controllers/adminController');

const router = express.Router();
const uploadFiles = require('../middlewares/upload');

// Route to create a vendor with image and thumbnail upload
router.post('/', uploadFiles, VendorController.createVendor);
router.patch('/:vendorId/status', VendorController.updateVendorStatus);
// router.post('/', vendorValidator, validateRequest, VendorController.createVendor);
router.get('/:id', VendorController.getVendorById);
router.get('/', VendorController.getAllVendors);
router.put('/:id',  VendorController.updateVendor);
router.delete('/:id', VendorController.deleteVendor);

module.exports = router;
