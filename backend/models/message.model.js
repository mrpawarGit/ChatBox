const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String }, // only for text
    imageOrVideoUrl: { type: String }, // for image/video uploads
    contentType: { type: String, enum: ["image", "video", "text"] },
    reactions: [
      {
        user: { type: mongoose.Schema.ObjectId, ref: "User" },
        emoji: String,
      },
    ],
    messageStatus: { type: String, default: "sent" },
  },
  { timestamps: true }
);

const MessageModel = mongoose.model("Message", messageSchema);
module.exports = MessageModel;
