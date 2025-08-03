const AppSettingsService = require('../services/appSettingsService');
const response = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

class AppSettingsController {
    createAppSettings = catchAsync(async (req, res, next) => {
        const appSettings = await AppSettingsService.createAppSettings(req.body);
        response(res, 201, appSettings, 'App settings created successfully');
    });

    updateAppSettings = catchAsync(async (req, res, next) => {
        const { id } = req.params;
        const appSettings = await AppSettingsService.updateAppSettings(id, req.body);
        response(res, 200, appSettings, 'App settings updated successfully');
    });

    getAppSettings = catchAsync(async (req, res, next) => {
        const appSettings = await AppSettingsService.getAppSettings();
        response(res, 200, appSettings, 'App settings retrieved successfully');
    });
}

module.exports = new AppSettingsController();
