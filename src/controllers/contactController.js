const ContactService = require('../services/contactService');
const response = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

class ContactController {
    createContact = catchAsync(async (req, res, next) => {
        const contact = await ContactService.createContact(req.body);
        response(res, 201, contact, 'Contact created successfully');
    });

    getAllContacts = catchAsync(async (req, res, next) => {
        const contacts = await ContactService.getAllContacts(req.query);
        response(res, 200, contacts, 'Contacts retrieved successfully');
    });

    getContactById = catchAsync(async (req, res, next) => {
        const contact = await ContactService.getContactById(req.params.id);
        response(res, 200, contact, 'Contact retrieved successfully');
    });

    updateContact = catchAsync(async (req, res, next) => {
        const contact = await ContactService.updateContact(req.params.id, req.body);
        response(res, 200, contact, 'Contact updated successfully');
    });

    deleteContact = catchAsync(async (req, res, next) => {
        await ContactService.deleteContact(req.params.id);
        response(res, 204, null, 'Contact deleted successfully');
    });
}

module.exports = new ContactController();
