const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destinationController');
const { isAuthenticated, optionalAuth } = require('../../src/middleware/auth');

// GET /api/v2/destinations
// Optional authentication to check wishlist status
router.get('/', optionalAuth, destinationController.getDestinations);

module.exports = router;