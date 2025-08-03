const Contact = require('../model/ContactModel');
const CustomError = require('../utils/customError');
const APIFeatures = require('../utils/apiFeatures');

class ContactService {
    async createContact(data) {
        const contact = new Contact(data);
        await contact.save();
        return contact;
    }


    async getAllContacts(queryParams) {
        const filter = {};
        let counts = await Contact.find().countDocuments();

        const features = new APIFeatures(Contact.find(filter), queryParams)
            .filter()
            .sort()
            .limitFields()
            .paginate();

        const tours = await features.query;
        return {
            results: tours.length,
            counts: counts,
            data: tours
        };
    }

    async getContactById(id) {
        const contact = await Contact.findById(id);
        if (!contact) {
            throw new CustomError('Contact not found', 404);
        }
        return contact;
    }

    async updateContact(id, data) {
        const contact = await Contact.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        if (!contact) {
            throw new CustomError('Contact not found', 404);
        }
        return contact;
    }

    async deleteContact(id) {
        const contact = await Contact.findByIdAndDelete(id);
        if (!contact) {
            throw new CustomError('Contact not found', 404);
        }
        return contact;
    }
}

module.exports = new ContactService();
