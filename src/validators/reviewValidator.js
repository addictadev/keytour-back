const { check } = require('express-validator');

const reviewValidator = [
    check('tour').not().isEmpty().withMessage('Tour ID is required'),
    check('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    check('comment').not().isEmpty().withMessage('Comment is required')
];

module.exports = reviewValidator;
