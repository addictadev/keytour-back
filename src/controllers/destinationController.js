const DestinationService = require('../services/destinationService');
const response = require('../utils/response');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken'); // Assuming you're using JWT for token validation
const User = require('../model/UserModel'); 
const Tour = require('../model/ToursModel'); 

class DestinationController {
    // Create a new destination
    generateValidFilePath = (filename) => {
        return filename.replace(/\\/g, '/'); // Replace all backslashes with forward slashes
    };

    createDestination = catchAsync(async (req, res, next) => {
        // Process the main image
        if (req.files && req.files.image) {
            req.body.image = this.generateValidFilePath(req.files.image[0].path); // Save the image path in the database
        }

        // Process the thumbnails if they exist
        if (req.files && req.files.imagesthubnails) {
            req.body.imagesthubnails = req.files.imagesthubnails.map(file => this.generateValidFilePath(file.path));
        }

        const destination = await DestinationService.createDestination(req.body);
        response(res, 201, destination, 'Destination created successfully');
    });
    // Get a destination by ID
    getDestinationById = catchAsync(async (req, res, next) => {
        const destination = await DestinationService.getDestinationById(req.params.id);
        response(res, 200, destination, 'Destination retrieved successfully');
    });

    // Get all destinations
    getAllDestinations = catchAsync(async (req, res, next) => {
        // Step 1: If role is not admin, add any necessary filters
        // if (!req.headers.role || req.headers.role !== 'admin') {
        //     // Add any filters specific to non-admin users if needed
        //     req.query.status = 'accepted';  // Example if you have a status field
        // }
    
        // Step 2: Check if a token is provided to get the user
        let user;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            const token = req.headers.authorization.split(' ')[1];
    
            // Verify the token and get the user
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            user = await User.findById(decoded.id);
            console.log(user)
        }
    
        // Step 3: Fetch the destinations using DestinationService
        const result = await DestinationService.getAllDestinations(req.query);
    
        // Step 4: If the user is logged in, check for wishlist
        if (user) {
            const userWishlist = user.destinationwishlist; // Array of ObjectIds in the user's wishlist
    
            // Add the `wishlist` key to the destinations that are in the user's wishlist
            result.data = result.data.map(destination => {
                // Check if any of the ObjectIds in the user's wishlist matches the destination's _id
                const isWishlisted = userWishlist.some(wishDest => wishDest.equals(destination._id)); // Use .equals() to compare ObjectIds
                return {
                    ...destination.toObject(), // Convert Mongoose object to plain JS object
                    wishlist: isWishlisted // Add wishlist key
                };
            });
        }
    
        // Step 5: Return the response
        response(res, 200, result.data, 'Destinations retrieved successfully', {
            results: result.results
        });
    });
    

    // Update a destination by ID
    updateDestination = catchAsync(async (req, res, next) => {
        const destination = await DestinationService.updateDestination(req.params.id, req.body);
        response(res, 200, destination, 'Destination updated successfully');
    });

    // Delete a destination by ID
    deleteDestination = catchAsync(async (req, res, next) => {
        await DestinationService.deleteDestination(req.params.id);
        response(res, 200, null, 'Destination deleted successfully');
    });
}

module.exports = new DestinationController();
