const User = require('../model/UserModel');
const Tour = require('../model/ToursModel');

// Service to get the user's home screen data
const getHomeScreenData = async (userId) => {
    let favoriteDestinations = [];

    // If a userId is provided, fetch the user's favorite destinations
    if (userId) {
        const user = await User.findById(userId).populate('destinationwishlist');

        if (user) {
            favoriteDestinations = user.destinationwishlist
                .sort((a, b) => b.created_at - a.created_at) // Sort by time
                .slice(0, 10); // Get top 10 destinations
        }
    }

    // Get top 10 tours based on the highest rating
    // const topRatedTours = await Tour.aggregate([
    //     { $sort: { "ratings.average": -1 } }, // Sort by average rating (highest first)
    //     { $limit: 10 }// Limit to 10 tours
    // ]);
    const topRatedTours = await Tour.aggregate([
         
        { $match: { status: 'accepted',
            capacity : 'pending',
            'availability.to': { $gte: new Date() }
         } }, // Only include tours with 'accepted' status
        { $sort: { "ratings.average": -1 } }, // Sort by average rating (highest first)
        { $limit: 10 } // Limit to 10 tours
    ]);
    
    // Return home screen data
    return {
        sections: {
            favoriteDestinations: {
 // Static image
                items: favoriteDestinations // Will be empty if no token/userId
            },
            topRatedTours: {
 // Static image
                items: topRatedTours
            },
            Beparten: {
 // Static image
 title: 'beparten lorem ipsum ',
 image: 'static-tour-image.jpg',
            }
        }
    };
};
module.exports = {
    getHomeScreenData
};
