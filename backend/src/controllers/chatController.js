const Conversation = require("../../models/Conversation");
const Message = require("../../models/Message");
const { uploadFileToCloudinary } = require("../../config/cloudinaryConfig");
const response = require("../../utils/responseHandler");

// Send a message (text/image/video)
exports.sendMessage = async (req, res) => {
  const { senderId, receiverId, content, messageStatus } = req.body;
  const file = req.file;
  try {
    // Sort participants to maintain consistent conversation key
    const participants = [senderId, receiverId].sort();

    
    // Check if conversation already exits
    let conversation = await Conversation.findOne({
      participants: participants,
    });

    // Create new conversation if not found
    if (!conversation) {
      conversation = new Conversation({
        participants,
        unreadCount: 0,
      });
      await conversation.save();
    }

    let imageOrVideoUrl = null;
    let contentType = null;

    // Handle file upload (image or video)
    if (file) {
      const uploadedFile = await uploadFileToCloudinary(file);

      if (!uploadedFile?.secure_url) {
        return response(res, 400, "Failed to upload media");
      }

      imageOrVideoUrl = uploadedFile.secure_url;

      if (file.mimetype.startsWith("image")) {
        contentType = "image";
      } else if (file.mimetype.startsWith("video")) {
        contentType = "video";
      } else {
        return response(res, 400, "Unsupported file type");
      }
    } else if (content?.trim()) {
      contentType = "text";
    } else {
      return response(res, 400, "Message content is required");
    }

    // Save message to DB
    const message = new Message({
      conversation: conversation._id,
      sender: senderId,
      receiver: receiverId,
      content,
      imageOrVideoUrl,
      contentType,
      messageStatus,
    });

    await message.save();

    // Update conversation metadata
    conversation.lastMessage = message._id;
    conversation.unreadCount += 1;
    await conversation.save();

    // Populate sender and receiver info
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture");

    // Emit socket event for real-time update
    if (req.io && req.socketUserMap) {
      const receiverSocketId = req.socketUserMap.get(receiverId);
      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("receive_message", populatedMessage);
        message.messageStatus = "delivered";
        await message.save();
      }
    }

    return response(res, 201, "Message send successfully", populatedMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    return response(res, 500, error.message);
  }
};

// Get all conversations of logged-in user
exports.getConversations = async (req, res) => {
  const userId = req.user.id;

  try {
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "username profilePicture isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender receiver",
          select: "username profilePicture",
        },
      })
      .sort({ updatedAt: -1 }); // Most recent first

    return response(res, 200, "Conversations retrieved", conversations);
  } catch (error) {
    console.error("Error getting conversations:", error);
    return response(res, 500, error.message);
  }
};

// Get messages of a specific conversation
exports.getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;

  try {
    // Validate conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return response(res, 404, "Conversation not found");
    }

    // Check access permission
    if (!conversation.participants.includes(userId)) {
      return response(res, 403, "Not authorized to view this conversation");
    }

    // Fetch messages sorted by creation time
    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture")
      .sort("createdAt");

    // Mark unread messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: userId,
        messageStatus: { $in: ["send", "delivered"] },
      },
      { $set: { messageStatus: "read" } }
    );

    // Reset conversation unread count
    conversation.unreadCount = 0;
    await conversation.save();

    return response(res, 200, "Messages retrieved", messages);
  } catch (error) {
    console.error("Error getting messages:", error);
    return response(res, 500, error.message);
  }
};

// Mark multiple messages as read
exports.markAsRead = async (req, res) => {
  const { messageIds } = req.body;
  const userId = req.user.id;

  try {
    // Get relevant messages to determine senders
    let messages = await Message.find({
      _id: { $in: messageIds },
      receiver: userId,
    });

    // Update messageStatus to "read"
    await Message.updateMany(
      { _id: { $in: messageIds }, receiver: userId },
      { $set: { messageStatus: "read" } }
    );

    // Notify original senders in real-time
    if (req.io && req.socketUserMap) {
      for (const message of messages) {
        const senderSocketId = req.socketUserMap.get(message.sender.toString());
        if (senderSocketId) {
          const updatedMessage = {
            _id: message._id,
            messageStatus: "read",
          };
          req.io.to(senderSocketId).emit("message_read", updatedMessage);
          await message.save(); // Optional: update each message
        }
      }
    }

    return response(res, 200, "Messages marked as read");
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return response(res, 500, error.message);
  }
};

// Delete a message (only by sender)
exports.deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return response(res, 404, "Message not found");
    }

    // Permission check: only sender can delete
    if (message.sender.toString() !== userId) {
      return response(res, 403, "Not authorized to delete this message");
    }

    await message.deleteOne();

    // Notify receiver in real-time via socket
    if (req.io && req.socketUserMap) {
      const receiverSocketId = req.socketUserMap.get(
        message.receiver.toString()
      );
      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("message_deleted", messageId);
      }
    }

    return response(res, 200, "Message deleted successfully");
  } catch (error) {
    console.error("Error deleting message:", error);
    return response(res, 500, error.message);
  }
};
