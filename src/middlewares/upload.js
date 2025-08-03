const multer = require('multer');
const path = require('path');

// Define storage for uploaded images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/images'); // Folder to store images
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for only accepting images
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            cb(null, true);

    // if (allowedMimeTypes.includes(file.mimetype)) {
        //     cb(null, true);
    // } else {
    //     cb(new Error('Invalid file type. Only JPG, JPEG, and PNG files are allowed.'));
    // }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        // fileSize: 1024 * 1024 * 10// Limit file size to 5MB
    }
});
const uploadFiles = upload.fields([
    { name: 'image', maxCount: 50},
    { name: 'imagesthubnails', maxCount: 50 }
]);

module.exports = uploadFiles;
