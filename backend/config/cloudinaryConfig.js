const multer = require('multer');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const fs = require('fs'); // Needed to clean up temp files

// Correct environment variable keys
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,       // typo fixed
    api_key: process.env.CLOUDINARY_API_KEY,       // typo fixed
    api_secret: process.env.CLOUDINARY_API_SECRET, // typo fixed
});

// Upload function
const uploadFileToCloudinary = (file) => {
    const options = {
        resource_type: file.mimetype.startsWith('video') ? 'video' : 'image',
    };

    return new Promise((resolve, reject) => {
        const uploader = file.mimetype.startsWith('video') 
            ? cloudinary.uploader.upload_large 
            : cloudinary.uploader.upload;

        uploader(file.path, options, (error, result) => {
            fs.unlink(file.path, () => {});
            if (error) {
                return reject(error);
            }
            resolve(result);
        });
    });
};

// Multer for temp file storage
const multerMiddleware = multer({ dest: 'uploads/' }).single('media');

module.exports = {
    multerMiddleware,
    uploadFileToCloudinary
};
