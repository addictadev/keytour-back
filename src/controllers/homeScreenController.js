const { getHomeScreenData } = require('../services/homeScreenService');
const jwt = require('jsonwebtoken');
const response = require('../utils/response');

// Controller to handle home screen request
const getHomeScreen = async (req, res) => {
    try {
        console.log('Home screen request received');

        let userId = null;
        const token = req.header('Authorization')?.replace('Bearer ', '');

        // If token exists, verify and extract the userId
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET); // Replace with your JWT secret
                userId = decoded.id;
            } catch (error) {
                return res.status(401).json({ message: 'Invalid token' });
            }
        }

        // Fetch home screen data; pass userId if available
        const homeScreenData = await getHomeScreenData(userId);
        return response(res, 200,homeScreenData, 'Home Screen retrieved successfully', {
   
        });
        // return res.json(homeScreenData);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getHomeScreen
};
