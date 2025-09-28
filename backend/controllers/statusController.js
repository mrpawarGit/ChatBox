const { uploadFileToCloudinary } = require("../config/cloudinaryConfig");
const StatusModel = require("../models/status.model");
const response = require("../utils/responseHandler"); // keep your existing helper name/path

// Create a status (text, image or video)
exports.createStatus = async (req, res) => {
  try {
    const userID = req.user && (req.user.userID || req.user.id || req.user._id);
    if (!userID) {
      return response(res, 401, "Unauthorized");
    }

    const file = req.file;
    const bodyContent =
      typeof req.body.content === "string" ? req.body.content.trim() : "";
    let mediaUrl = null;
    let finalContentType = req.body.contentType || "text";

    // If a file is uploaded, upload to Cloudinary and determine content type
    if (file) {
      const uploadResult = await uploadFileToCloudinary(file);
      if (!uploadResult?.secure_url && !uploadResult?.url) {
        return response(res, 400, "Failed to upload media");
      }

      mediaUrl = uploadResult.secure_url || uploadResult.url;
      const mimetype = file.mimetype || "";

      if (mimetype.startsWith("image")) {
        finalContentType = "image";
      } else if (mimetype.startsWith("video")) {
        finalContentType = "video";
      } else {
        return response(res, 400, "Unsupported file type");
      }
    } else if (bodyContent.length > 0) {
      finalContentType = "text";
    } else {
      return response(res, 400, "Status content is required (text or media)");
    }

    // expiresAt — 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Build and save status document
    const statusDoc = new StatusModel({
      user: userID,
      content: mediaUrl || bodyContent,
      contentType: finalContentType,
      viewers: [],
      expiresAt,
    });

    await statusDoc.save();

    // Populate user and viewers for response
    const populatedStatus = await StatusModel.findById(statusDoc._id)
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture")
      .lean();

    return response(res, 201, "Status created successfully", populatedStatus);
  } catch (error) {
    console.error("createStatus error:", error);
    return response(res, 500, "Internal Server Error");
  }
};

// getStatus
exports.getStatus = async (req, res) => {
  try {
    const statuses = await StatusModel.find({
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture")
      .sort({ createdAt: -1 });

    return response(res, 200, "Status retrived succesfully", statuses);
  } catch (error) {
    console.error("getStatus error:", error);
    return response(res, 500, "Internal Server Error");
  }
};
