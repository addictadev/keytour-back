const { body } = require('express-validator');

const validateAvailability = [
    body('tour').notEmpty().withMessage('Tour ID is required').isMongoId().withMessage('Invalid Tour ID'),
    body('dates').isArray().withMessage('Dates must be an array'),
    body('dates.*').isISO8601().withMessage('Each date must be in ISO8601 format (e.g., YYYY-MM-DD)'),
    body('room_types').isArray().withMessage('Room types must be an array'),
    body('room_types.*.name').notEmpty().withMessage('Room name is required'),
    body('room_types.*.netprice')
        .isNumeric()
        .withMessage('Net price must be a number')
        .isFloat({ min: 0 })
        .withMessage('Net price must be greater than or equal to 0'),
];

module.exports = validateAvailability;
