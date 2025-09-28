const { uploadFileToCloudinary } = require("../config/cloudinaryConfig");
const ConversationModel = require("../models/conversation.model");
const MessageModel = require("../models/message.model");
const response = require("../utils/responseHandler");

// Send a message between two users
exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content = "" } = req.body;
    const messageStatus = req.body.messageStatus || "sent";
    const file = req.file;

    if (!senderId || !receiverId) {
      return response(res, 400, "senderId and receiverId are required");
    }

    // Sort participant ids as strings so the conversation lookup is consistent
    const participants = [String(senderId), String(receiverId)].sort();

    // Check if conversation already exists
    let conversation = await ConversationModel.findOne({
      participants,
    });

    if (!conversation) {
      conversation = new ConversationModel({ participants });
      await conversation.save();
    }

    let imageOrVideoUrl = null;
    let contentType = null;
    const trimmedContent = typeof content === "string" ? content.trim() : "";

    // Handle file upload if provided
    if (file) {
      const uploadResult = await uploadFileToCloudinary(file);
      if (!uploadResult?.secure_url && !uploadResult?.url) {
        return response(res, 400, "Failed to upload media");
      }

      imageOrVideoUrl = uploadResult.secure_url || uploadResult.url;

      // Determine content type using mimetype
      const mimetype = file.mimetype || "";
      if (mimetype.startsWith("image")) {
        contentType = "image";
      } else if (mimetype.startsWith("video")) {
        contentType = "video";
      } else {
        return response(res, 400, "Unsupported file type");
      }
    } else if (trimmedContent.length > 0) {
      // Text message
      contentType = "text";
    } else {
      return response(res, 400, "Message content is required");
    }

    // Create and save message
    const message = new MessageModel({
      conversation: conversation._id,
      sender: senderId,
      receiver: receiverId,
      content: trimmedContent || undefined,
      imageOrVideoUrl,
      contentType,
      messageStatus,
    });

    await message.save();

    // Update conversation.lastMessage and unread count
    conversation.lastMessage = message._id;
    conversation.unreadCount = (conversation.unreadCount || 0) + 1;
    conversation.updatedAt = new Date();
    await conversation.save();

    // Populate sender and receiver fields for response
    const populatedMessage = await MessageModel.findById(message._id)
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture")
      .lean();

    return response(res, 201, "Message sent successfully", populatedMessage);
  } catch (error) {
    console.error("sendMessage error:", error);
    return response(res, 500, "Internal Server Error");
  }
};

// Get all conversations for the authenticated user
exports.getConversation = async (req, res) => {
  const userID = req.user && (req.user.userID || req.user.id || req.user._id);

  try {
    if (!userID) {
      return response(res, 401, "Unauthorized");
    }

    const conversations = await ConversationModel.find({
      participants: userID,
    })
      .populate("participants", "username profilePicture isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender receiver",
          select: "username profilePicture",
        },
      })
      .sort({ updatedAt: -1 })
      .lean();

    return response(
      res,
      200,
      "Conversations retrieved successfully",
      conversations
    );
  } catch (error) {
    console.error("getConversation error:", error);
    return response(res, 500, "Internal Server Error");
  }
};

// Get all messages for a specific conversation
exports.getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const userID = req.user && (req.user.userID || req.user.id || req.user._id);

  try {
    if (!conversationId) {
      return response(res, 400, "conversationId is required");
    }
    if (!userID) {
      return response(res, 401, "Unauthorized");
    }

    const conversation = await ConversationModel.findById(
      conversationId
    ).lean();
    if (!conversation) {
      return response(res, 404, "Conversation not found");
    }

    // Check the user is a participant
    const isParticipant = (conversation.participants || []).some(
      (p) => String(p) === String(userID)
    );
    if (!isParticipant) {
      return response(res, 403, "Not authorized to view this conversation");
    }

    // Fetch messages sorted by creation time ascending (oldest first)
    const messages = await MessageModel.find({ conversation: conversationId })
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture")
      .sort({ createdAt: 1 })
      .lean();

    // Mark messages addressed to this user as "read" if they were in 'sent' or 'delivered' states
    await MessageModel.updateMany(
      {
        conversation: conversationId,
        receiver: userID,
        messageStatus: { $in: ["sent", "delivered"] },
      },
      { $set: { messageStatus: "read" } }
    );

    // Reset unread count on the conversation
    await ConversationModel.findByIdAndUpdate(conversationId, {
      unreadCount: 0,
    });

    return response(res, 200, "Messages retrieved successfully", messages);
  } catch (error) {
    console.error("getMessages error:", error);
    return response(res, 500, "Internal Server Error");
  }
};

// mark messages as read
exports.markAsRead = async (req, res) => {
  const { messageId } = req.body;
  const userID = req.user.userID;
  try {
    // get relevant message to determine sender
    let message = await MessageModel.find({
      _id: { $in: messageId },
      receiver: userID,
    });
    await MessageModel.updateMany(
      { _id: { $in: messageId } },
      { $set: { messageStatus: "read" } }
    );
    return response(res, 200, "Messages marks as read", message);
  } catch (error) {
    console.error("markAsRead error:", error);
    return response(res, 500, "Internal Server Error");
  }
};

// Delete a message (only the sender can delete)
exports.deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const userID = req.user && (req.user.userID || req.user.id || req.user._id);

  try {
    if (!messageId) {
      return response(res, 400, "messageId is required");
    }
    if (!userID) {
      return response(res, 401, "Unauthorized");
    }

    const message = await MessageModel.findById(messageId);
    if (!message) {
      return response(res, 404, "Message not found");
    }

    // Only the sender may delete their message
    if (String(message.sender) !== String(userID)) {
      return response(res, 403, "Not authorized to delete this message");
    }

    const conversationId = message.conversation;

    // Delete the message
    await message.deleteOne();

    // Update conversation.lastMessage to the latest message (if any)
    try {
      const lastMsg = await MessageModel.findOne({
        conversation: conversationId,
      })
        .sort({ createdAt: -1 })
        .select("_id")
        .lean();

      await ConversationModel.findByIdAndUpdate(
        conversationId,
        { lastMessage: lastMsg ? lastMsg._id : null },
        { new: true }
      );
    } catch (updErr) {
      // Log but don't fail the whole request if conversation update fails
      console.error("Failed to update conversation lastMessage:", updErr);
    }

    return response(res, 200, "Message deleted successfully", { messageId });
  } catch (error) {
    console.error("deleteMessage error:", error);
    return response(res, 500, "Internal Server Error");
  }
};
