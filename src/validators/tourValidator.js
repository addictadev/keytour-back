const { check } = require('express-validator');

const tourValidator = [
    check('title.en').not().isEmpty().withMessage('English title is required'),
    check('title.ar').not().isEmpty().withMessage('Arabic title is required'),
    check('destination').not().isEmpty().withMessage('Destination is required'),
    check('tour_type').isIn(['single-day', 'multi-day', 'activity', 'transfer'])
        .withMessage('Invalid tour type'),
    // check('image_url').isURL().withMessage('Image URL is required'),
    check('brief.en').not().isEmpty().withMessage('English brief is required'),
    check('brief.ar').not().isEmpty().withMessage('Arabic brief is required'),
    check('program').isArray({ min: 1 }).withMessage('Program details are required'),
    check('room_types.single.shared').isNumeric().withMessage('Price for shared single room is required'),
    check('room_types.single.private').isNumeric().withMessage('Price for private single room is required'),

];

module.exports = tourValidator;
