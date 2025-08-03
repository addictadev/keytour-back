const express = require('express');
const AppSettingsController = require('../controllers/appSettingsController');
const router = express.Router();

// Route to create app settings
router.post('/', AppSettingsController.createAppSettings);

// Route to update app settings
// router.put('/:id', AppSettingsController.updateAppSettings);
router.patch('/:id', AppSettingsController.updateAppSettings);

// Route to get app settings
router.get('/', AppSettingsController.getAppSettings);

module.exports = router;
