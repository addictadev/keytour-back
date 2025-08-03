// const jwt = require('../utils/jwt');
// const CustomError = require('../utils/customError');
// const User = require('../model/UserModel');

// const authMiddleware = async (req, res, next) => {
//     const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

//     if (!token) {
//         return next(new CustomError('Not authenticated', 401));
//     }

//     try {
//         const decoded = jwt.verifyToken(token);
//         req.user = await User.findById(decoded.id).select('-password'); // Exclude password field
//         next();
//     } catch (err) {
//         next(new CustomError('Invalid token', 401));
//     }
// };

// module.exports = authMiddleware;






// const jwt = require('../utils/jwt');
// const CustomError = require('../utils/customError');
// const User = require('../model/UserModel');

// const authMiddleware = async (req, res, next) => {
//     try {

//         // Extract the token from cookies or Authorization header
//         const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

//         // Check if the token exists
//         if (!token) {
//             return next(new CustomError('Not authenticated. Token is missing.', 401));
//         }

//         // Verify the token
//         const decoded = jwt.verifyToken(token);

//         // Check if the decoded token contains a valid user ID
//         if (!decoded || !decoded.id) {
//             return next(new CustomError('Invalid token. Token does not contain valid user data.', 401));
//         }

//         // Find the user by ID and exclude the password field
//         const user = await User.findById(decoded.id).select('-password');

//         // If user is not found, throw an error
//         if (!user) {
//             return next(new CustomError('User not found. Authentication failed.', 401));
//         }

//         // Attach the user object to the request
//         req.user = user;
//         next(); // Proceed to the next middleware or route handler

//     } catch (err) {
//         // Differentiate between token errors and general errors
//         if (err.name === 'TokenExpiredError') {
//             return next(new CustomError('Token has expired. Please log in again.', 401));
//         } else if (err.name === 'JsonWebTokenError') {
//             return next(new CustomError('Invalid token. Please log in again.', 401));
//         } else {
//             // Handle other unexpected errors
//             return next(new CustomError('Authentication failed. Please try again later.', 500));
//         }
//     }
// };

// module.exports = authMiddleware;



















////////////////////////////////////we will 

const jwt = require('../utils/jwt');
const CustomError = require('../utils/customError');
const Admin = require('../model/AdminModel');
const Vendor = require('../model/VendorModel');
const User = require('../model/UserModel');

// Middleware to check if a user with the given role is allowed to access the route
const authMiddleware = (...allowedRoles) => {
    return async (req, res, next) => {
        console.log("aaaaaaaaaaaa")
        try {
            // Extract the role from request header
            const role = req.headers['role'];

            // Check if the role is provided in the header
            // if (!role) {
            //     return next(new CustomError('Role is required in the request header.', 400));
            // }

            // Extract the token from cookies or Authorization header
            const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

            // Check if the token exists
            if (!token) {
                return next(new CustomError('Not authenticated. Token is missing.', 401));
            }

            // Verify the token
            const decoded = jwt.verifyToken(token);

            // Check if the decoded token contains a valid user ID
            if (!decoded || !decoded.id) {
                return next(new CustomError('Invalid token. Token does not contain valid user data.', 401));
            }
console.log(decoded)
            // Variable to hold the user fetched from the respective table
            let user;

            // Determine which model (table) to query based on the role from the header
            if (role === 'admin') {
                user = await Admin.findById(decoded.id).select('-password');
            } else if (role === 'vendor') {
                user = await Vendor.findById(decoded.id).select('-password');

            } else if (role === 'user') {
                user = await User.findById(decoded.id).select('-password');
                
            } else {
                return next(new CustomError('Invalid role. Role must be admin, vendor, or user.', 400));
            }

            // If user is not found, throw an error
            if (!user) {
                return next(new CustomError(`${role.charAt(0).toUpperCase() + role.slice(1)} not found. Authentication failed.`, 401));
            }
            if (user?.isBlocked) throw new CustomError('User is blocked. Please contact support.', 403)

            // Check if the user's role is allowed to access the route
            if (!allowedRoles.includes(user.defaultrole)) {
                return next(new CustomError('You do not have permission to access this route.', 403));
            }

            // Attach the user object to the request
            req.user = user;
            req.role = role; // Store role in the request for potential future use

            next(); // Proceed to the next middleware or route handler

        } catch (err) {
            // Differentiate between token errors and general errors
            if (err.name === 'TokenExpiredError') {
                return next(new CustomError('Token has expired. Please log in again.', 401));
            } else if (err.name === 'JsonWebTokenError') {
                return next(new CustomError('Invalid token. Please log in again.', 401));
            } else {
                // Handle other unexpected errors
                return next(new CustomError('Authentication failed. Please try again later.', 500));
            }
        }
    };
};

module.exports = authMiddleware;
