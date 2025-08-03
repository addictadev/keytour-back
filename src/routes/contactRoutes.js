const express = require('express');
const ContactController = require('../controllers/contactController');

const router = express.Router();

router
    .route('/')
    .post(ContactController.createContact)  // Create contact
    .get(ContactController.getAllContacts);  // Get all contacts

router
    .route('/:id')
    .get(ContactController.getContactById)  // Get contact by ID
    .patch(ContactController.updateContact)  // Update contact
    .delete(ContactController.deleteContact);  // Delete contact by ID

module.exports = router;
