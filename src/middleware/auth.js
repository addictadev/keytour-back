const jwt = require('../utils/jwt');
const CustomError = require('../utils/customError');
const User = require('../model/UserModel');

exports.optionalAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            req.user = null;
            return next();
        }

        try {
            // Verify the token
            const decoded = jwt.verifyToken(token);

            // Check if the decoded token contains a valid user ID
            if (!decoded || !decoded.id) {
                req.user = null;
                return next();
            }

            // Find user and populate destination wishlist
            const user = await User.findById(decoded.id)
                .select('-password')
                .populate('destinationwishlist');

            if (!user || user.isBlocked) {
                req.user = null;
                return next();
            }

            // Attach the user object to the request
            req.user = user;
            next();

        } catch (jwtError) {
            // If token verification fails, treat as unauthenticated
            req.user = null;
            return next();
        }

    } catch (error) {
        console.error('Optional Auth Error:', error);
        req.user = null;
        next();
    }
};
