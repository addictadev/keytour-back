const FAQService = require('../services/FAQService');
const response = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

class FAQController {
    async createFAQ(req, res, next) {
        console.log("object")
        try {
            const faq = await FAQService.createFAQ(req.body);
            response(res, 201, faq, 'FAQ created successfully');
        } catch (err) {
            next(err);
        }
    }

    async getFAQById(req, res, next) {
        try {
            const faq = await FAQService.getFAQById(req.params.id);
            response(res, 200, faq, 'FAQ retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    getAllFAQs = catchAsync(async (req, res, next) => {
        const result = await FAQService.getAllFAQs();
        console.log(result)
        response(res, 200, result.data, 'FAQs retrieved successfully', {
            results: result,
            counts: result.length,
        });
    });

    async updateFAQ(req, res, next) {
        try {
            const faq = await FAQService.updateFAQ(req.params.id, req.body);
            response(res, 200, faq, 'FAQ updated successfully');
        } catch (err) {
            next(err);
        }
    }

    async deleteFAQ(req, res, next) {
        try {
            await FAQService.deleteFAQ(req.params.id);
            response(res, 200, null, 'FAQ deleted successfully');
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new FAQController();
