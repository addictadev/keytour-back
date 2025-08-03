const AppSettings = require('../model/AppSettingsModel');
const CustomError = require('../utils/customError');

class AppSettingsService {
    async createAppSettings(data) {
        const appSettings = new AppSettings(data);
        await appSettings.save();
        return appSettings;
    }

    async updateAppSettings(id, data) {
        const appSettings = await AppSettings.findByIdAndUpdate(id, data, { new: true });
        if (!appSettings) {
            throw new CustomError('App Settings not found', 404);
        }
        return appSettings;
    }

    async getAppSettings() {
        const appSettings = await AppSettings.findOne(); // Assuming there's only one settings document
        if (!appSettings) {
            throw new CustomError('App Settings not found', 404);
        }
        return appSettings;
    }
}

module.exports = new AppSettingsService();
