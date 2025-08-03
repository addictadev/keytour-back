const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

class ImageService {
    static async createThumbnail(imagePath, outputDir) {
        const filename = path.basename(imagePath);
        const thumbnailPath = path.join(outputDir, `thumb-${filename}`);

        await sharp(imagePath)
            .resize(200, 200)
            .toFile(thumbnailPath);

        return thumbnailPath;
    }

    static deleteFile(filePath) {
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
            }
        });
    }
}

module.exports = ImageService;
