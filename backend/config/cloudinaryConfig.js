const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload file to Cloudinary
const uploadFileToCloudinary = (file) => {
  const isVideo = file.mimetype.startsWith("video");

  const options = {
    resource_type: isVideo ? "video" : "image",
  };

  return new Promise((resolve, reject) => {
    const uploader = isVideo
      ? cloudinary.uploader.upload
      : cloudinary.uploader.upload;

    uploader(file.path, options, (error, result) => {
      // Delete local temp file
      fs.unlink(file.path, (err) => {
        if (err) console.error("Failed to delete temp file:", err);
      });

      if (error) return reject(error);
      resolve(result);
    });
  });
};

// Multer middleware to handle single file upload
const multerMiddleware = multer({ dest: "uploads/" }).single("media");

module.exports = { uploadFileToCloudinary, multerMiddleware };
