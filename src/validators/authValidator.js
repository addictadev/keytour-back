const { check } = require('express-validator');

const registerValidator = [
    check('name').not().isEmpty().withMessage('Name is required'),
    check('email').isEmail().withMessage('Valid email is required'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    check('phone').not().isEmpty().withMessage('Phone is required'),
];

const loginValidator = [
    check('email').isEmail().withMessage('Valid email is required'),
    check('password').not().isEmpty().withMessage('Password is required'),
];

const otpValidator = [
    check('userId').not().isEmpty().withMessage('User ID is required'),
    // check('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
];

const resetPasswordValidator = [
    check('email').not().isEmpty().withMessage('User ID is required'),
    check('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    check('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
];

module.exports = { registerValidator, loginValidator, otpValidator, resetPasswordValidator };
