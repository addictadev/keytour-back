const AboutUs = require('../model/AboutUsModel');
const CustomError = require('../utils/customError');
const APIFeatures = require('../utils/apiFeatures');

class AboutUsService {
    async createAboutUs(data) {
        const aboutUs = new AboutUs(data);
        await aboutUs.save();
        return aboutUs;
    }


    async getAllAboutUs(queryParams) {
        const filter = {};
        let counts = await AboutUs.find().countDocuments();

        const features = new APIFeatures(AboutUs.find(filter), queryParams)
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
    async getAboutUsById(id) {
        const aboutUs = await AboutUs.findById(id);
        if (!aboutUs) {
            throw new CustomError('About Us entry not found', 404);
        }
        return aboutUs;
    }

    async updateAboutUs(id, data) {
        const aboutUs = await AboutUs.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        if (!aboutUs) {
            throw new CustomError('About Us entry not found', 404);
        }
        return aboutUs;
    }

    async deleteAboutUs(id) {
        const aboutUs = await AboutUs.findByIdAndDelete(id);
        if (!aboutUs) {
            throw new CustomError('About Us entry not found', 404);
        }
        return aboutUs;
    }
}

module.exports = new AboutUsService();
