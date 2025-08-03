const jwt = require('jsonwebtoken');
const CustomError = require('./customError');

/**
 * Creates a JWT token for a user
 * @param {Object} user - User object containing _id and defaultrole
 * @returns {string} JWT token
 */
const createToken = (user) => {
    if (!user?._id) {
        throw new CustomError('User ID is required for token creation', 400);
    }

    try {
        return jwt.sign(
            { 
                id: user._id,
                defaultrole: user?.defaultrole || 'user'
            }, 
            process.env.JWT_SECRET,
            { 
                expiresIn: process.env.JWT_EXPIRES_IN || '24h',
                algorithm: 'HS256'
            }
        );
    } catch (error) {
        throw new CustomError('Error creating token', 500);
    }
};

/**
 * Verifies a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
    if (!token || typeof token !== 'string') {
        throw new CustomError('Invalid token format', 401);
    }

    try {
        // Remove 'Bearer ' if present
        const tokenToVerify = token.startsWith('Bearer ') 
            ? token.slice(7) 
            : token;

        return jwt.verify(tokenToVerify, process.env.JWT_SECRET, {
            algorithms: ['HS256']
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new CustomError('Token has expired', 401);
        }
        if (error.name === 'JsonWebTokenError') {
            throw new CustomError('Invalid token', 401);
        }
        throw new CustomError('Token verification failed', 401);
    }
};

/**
 * Extracts token from request headers or cookies
 * @param {Object} req - Express request object
 * @returns {string|null} Extracted token or null
 */
const extractToken = (req) => {
    if (req.headers.authorization?.startsWith('Bearer ')) {
        return req.headers.authorization.split(' ')[1];
    }
    if (req.cookies?.token) {
        return req.cookies.token;
    }
    return null;
};

module.exports = { 
    createToken, 
    verifyToken,
    extractToken
};
// const jwt = require('jsonwebtoken');

// const createToken = (user) => {
//     return jwt.sign({ id: user._id,defaultrole:user?.defaultrole }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
// };

// const verifyToken = (token) => {
//     return jwt.verify(token, process.env.JWT_SECRET);
// };

// module.exports = { createToken, verifyToken };

