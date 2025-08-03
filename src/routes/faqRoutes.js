const express = require('express');
const FAQController = require('../controllers/FAQController');

const router = express.Router();

router
    .route('/')
    .post(FAQController.createFAQ)
    .get(FAQController.getAllFAQs);

router
    .route('/:id')
    .get(FAQController.getFAQById)
    .patch(FAQController.updateFAQ)
    .delete(FAQController.deleteFAQ);

module.exports = router;
