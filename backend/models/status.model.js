const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    contentType: {
      type: String,
      enum: ["image", "video", "text"],
      default: "text",
    },
    viewers: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

const StatusModel = mongoose.model("Status", statusSchema);

module.exports = StatusModel;
