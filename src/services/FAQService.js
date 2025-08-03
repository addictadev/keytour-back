const FAQ = require('../model/FAQModel');
const CustomError = require('../utils/customError');

class FAQService {
    async createFAQ(data) {
        const faq = new FAQ(data);
        await faq.save();
        return faq;
    }

    async getAllFAQs() {
        const faq = await FAQ.find();
  

        return faq;
    }

    async getFAQById(id) {
        const faq = await FAQ.findById(id);
        if (!faq) {
            throw new CustomError('FAQ not found', 404);
        }
        return faq;
    }

    async updateFAQ(id, data) {
        const faq = await FAQ.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
        if (!faq) {
            throw new CustomError('FAQ not found', 404);
        }
        return faq;
    }

    async deleteFAQ(id) {
        const faq = await FAQ.findByIdAndDelete(id);
        if (!faq) {
            throw new CustomError('FAQ not found', 404);
        }
        return faq;
    }
}

module.exports = new FAQService();
