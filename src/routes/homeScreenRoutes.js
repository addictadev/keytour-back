const express = require('express');
const { getHomeScreen } = require('../controllers/homeScreenController');

const router = express.Router();

// Route to get home screen
router.get('/', getHomeScreen);

module.exports = router;
