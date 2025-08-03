const AboutUsService = require('../services/aboutUsService');
const response = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

class AboutUsController {
    
    generateValidFilePath = (filename) => {
        return filename.replace(/\\/g, '/'); // Replace all backslashes with forward slashes
    };

    createAboutUs = catchAsync(async (req, res, next) => {
        console.log(req.files)
        if (req.files && req.files.image) {
            req.body.image = this.generateValidFilePath(req.files.image[0].path); // Save the image path in the database
        }

        const aboutUs = await AboutUsService.createAboutUs(req.body);
        response(res, 201, aboutUs, 'About Us entry created successfully');
    });

    getAllAboutUs = catchAsync(async (req, res, next) => {
        const aboutUs = await AboutUsService.getAllAboutUs(req.query);
        response(res, 200, aboutUs, 'About Us entries retrieved successfully');
    });

    getAboutUsById = catchAsync(async (req, res, next) => {
        const aboutUs = await AboutUsService.getAboutUsById(req.params.id);
        response(res, 200, aboutUs, 'About Us entry retrieved successfully');
    });

    updateAboutUs = catchAsync(async (req, res, next) => {
        if (req.file) {
            req.body.image = this.generateValidFilePath(req.file.path);
        }

        const aboutUs = await AboutUsService.updateAboutUs(req.params.id, req.body);
        response(res, 200, aboutUs, 'About Us entry updated successfully');
    });

    deleteAboutUs = catchAsync(async (req, res, next) => {
        await AboutUsService.deleteAboutUs(req.params.id);
        response(res, 204, null, 'About Us entry deleted successfully');
    });
}

module.exports = new AboutUsController();
