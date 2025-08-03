const Destination = require('../../src/model/DestinationModel');
const Tour = require('../../src/model/ToursModel');
const User = require('../../src/model/UserModel');
const mongoose = require('mongoose');

class DestinationService {
    async getDestinations({
        page = 1,
        limit = 10,
        search = '',
        sortBy = 'created_at',
        sortOrder = 'desc',
        userId = null
    }) {
        try {
            const skip = (page - 1) * limit;
            
            // Get user's wishlist if userId exists
            let userWishlist = [];
            if (userId) {
                const user = await User.findById(userId).select('destinationwishlist');
                if (user?.destinationwishlist) {
                    userWishlist = user.destinationwishlist.map(id => 
                        mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null
                    ).filter(id => id !== null);
                }
            }

            // Build search query
            const searchQuery = search ? {
                $or: [
                    { 'country.en': { $regex: search, $options: 'i' } },
                    { 'country.ar': { $regex: search, $options: 'i' } },
                    { 'city.en': { $regex: search, $options: 'i' } },
                    { 'city.ar': { $regex: search, $options: 'i' } }
                ]
            } : {};

            const destinations = await Destination.aggregate([
                { $match: searchQuery },
                {
                    $lookup: {
                        from: 'tours',
                        localField: '_id',
                        foreignField: 'destination',
                        pipeline: [
                            { 
                                $match: { 
                                    status: 'accepted'  // Only get accepted tours
                                } 
                            }
                        ],
                        as: 'tours'
                    }
                },
                {
                    $lookup: {
                        from: 'reviews',
                        let: { tourIds: '$tours._id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: ['$tour', '$$tourIds']
                                    }
                                }
                            }
                        ],
                        as: 'reviews'
                    }
                },
                {
                    $addFields: {
                        toursCount: { $size: '$tours' },  // This will now only count accepted tours
                        averageRating: {
                            $cond: [
                                { $gt: [{ $size: '$reviews' }, 0] },
                                { 
                                    $round: [
                                        { 
                                            $avg: '$reviews.rating'
                                        },
                                        1
                                    ]
                                },
                                0
                            ]
                        },
                        reviewsCount: { $size: '$reviews' },
                        isWishlisted: {
                            $cond: {
                                if: { $in: ['$_id', userWishlist] },
                                then: true,
                                else: false
                            }
                        }
                    }
                },
                {
                    $project: {
                        country: 1,
                        city: 1,
                        region: 1,
                        description: 1,
                        image: 1,
                        averageRating: 1,
                        reviewsCount: 1,
                        toursCount: 1,
                        isWishlisted: 1,
                        created_at: 1,
                        updated_at: 1
                    }
                },
                { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } },
                { $skip: skip },
                { $limit: parseInt(limit) }
            ]);

            const total = await Destination.countDocuments(searchQuery);

            return {
                destinations,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error in getDestinations:', error);
            throw error;
        }
    }
}

module.exports = new DestinationService();