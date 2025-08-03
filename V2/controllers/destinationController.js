const destinationService = require('../services/destinationService');

class DestinationController {
    async getDestinations(req, res) {
        try {
            const { page, limit, search, sortBy, sortOrder } = req.query;
            const userId = req.user?._id; // From auth middleware
console.log(userId);
            const result = await destinationService.getDestinations({
                page,
                limit,
                search,
                sortBy,
                sortOrder,
                userId
            });

            res.status(200).json({
                success: true,
                data: result.destinations,
                pagination: result.pagination
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new DestinationController();