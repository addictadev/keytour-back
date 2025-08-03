const { check } = require('express-validator');

const vendorValidator = [
    check('name').not().isEmpty().withMessage('Name is required'),
    check('email').isEmail().withMessage('Valid email is required'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    check('company_name').not().isEmpty().withMessage('Company name is required'),
    check('company_address').not().isEmpty().withMessage('Company address is required'),
    check('phone').not().isEmpty().withMessage('Phone number is required')
];

module.exports = vendorValidator;
