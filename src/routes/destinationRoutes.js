const express = require('express');
const DestinationController = require('../controllers/destinationController');
const uploadFiles = require('../middlewares/upload');
const router = express.Router();
router.post(
    '/',
    uploadFiles,  // Middleware to handle image uploads
    DestinationController.createDestination
);
router
    .route('/')
    .get(DestinationController.getAllDestinations);

router
    .route('/:id')
    .get(DestinationController.getDestinationById)
    .put(uploadFiles,DestinationController.updateDestination)
    .delete(DestinationController.deleteDestination);

module.exports = router;
