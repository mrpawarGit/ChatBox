const { Server } = require("socket.io");
const User = require("../../models/User");
const Message = require("../../models/Message");
const socketAuthMiddleware = require("../middlerwares/socketAuthMiddleware");
const handleVideoCallEvents = require("../../utils/video-call-events");

// Map to store online users: userId -> socketId
const onlineUsers = new Map();

// Map to track typing status: userId -> { [conversationId]: boolean, [conversationId_timeout]: timeout }
const typingUsers = new Map();

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    },
    pingTimeout: 60000, // Disconnect inactive sockets after 60s
  });

  //middleware
  // io.use(socketAuthMiddleware);

  // When a new socket connection is established
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    let userId = null; // Will store the current user's ID

    /**
     * Handle user connection and mark them online in DB
     */
    socket.on("user_connected", async (connectingUserId) => {
      try {
        userId = connectingUserId;
        socket.userId = userId // CRITICAL: Store userId on socket for video call events
        onlineUsers.set(userId, socket.id);
        socket.join(userId); // Join personal room for direct emits

        // Update user status in DB
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date(),
        });

        // Notify all users that this user is now online
        io.emit("user_status", { userId, isOnline: true });
      } catch (error) {
        console.error("Error handling user connection:", error);
      }
    });

    /**
     * Return online status of requested user
     */
    socket.on("get_user_status", (requestedUserId, callback) => {
      const isOnline = onlineUsers.has(requestedUserId);
      callback({
        userId: requestedUserId,
        isOnline,
        lastSeen: isOnline ? new Date() : null,
      });
    });

    /**
     * Forward message to receiver if online
     */
    socket.on("send_message", async (message) => {
      try {
        const receiverSocketId = onlineUsers.get(message.receiver._id);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", message);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    /**
     * Update messages as read and notify sender
     */
    socket.on("message_read", async ({ messageIds, senderId }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { messageStatus: "read" } }
        );

        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          messageIds.forEach((messageId) => {
            io.to(senderSocketId).emit("message_status_update", {
              messageId,
              messageStatus: "read",
            });
          });
        }
      } catch (error) {
        console.error("Error updating message read status:", error);
      }
    });

    /**
     * Handle typing start event and auto-stop after 3s
     */
    socket.on("typing_start", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;

      if (!typingUsers.has(userId)) typingUsers.set(userId, {});
      const userTyping = typingUsers.get(userId);

      userTyping[conversationId] = true;

      // Clear any existing timeout
      if (userTyping[`${conversationId}_timeout`]) {
        clearTimeout(userTyping[`${conversationId}_timeout`]);
      }

      // Auto-stop typing after 3 seconds
      userTyping[`${conversationId}_timeout`] = setTimeout(() => {
        userTyping[conversationId] = false;
        socket.to(receiverId).emit("user_typing", {
          userId,
          conversationId,
          isTyping: false,
        });
      }, 3000);

      // Notify receiver
      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: true,
      });
    });

    /**
     * Handle manual typing stop event
     */
    socket.on("typing_stop", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;

      if (typingUsers.has(userId)) {
        const userTyping = typingUsers.get(userId);
        userTyping[conversationId] = false;

        if (userTyping[`${conversationId}_timeout`]) {
          clearTimeout(userTyping[`${conversationId}_timeout`]);
          delete userTyping[`${conversationId}_timeout`];
        }
      }

      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: false,
      });
    });

    /**
     * Add or update reaction on a message
     */
    socket.on(
      "add_reaction",
      async ({ messageId, emoji, userId: reactingUserId }) => {
        try {
          const message = await Message.findById(messageId);
          if (!message) return;

          const existingIndex = message.reactions.findIndex(
            (r) => r.user.toString() === reactingUserId
          );

          if (existingIndex > -1) {
            const existing = message.reactions[existingIndex];
            if (existing.emoji === emoji) {
              // Remove same reaction (toggle off)
              message.reactions.splice(existingIndex, 1);
            } else {
              // Change emoji
              message.reactions[existingIndex].emoji = emoji;
            }
          } else {
            // Add new reaction
            message.reactions.push({ user: reactingUserId, emoji });
          }

          await message.save();

          // Repopulate updated message
          const populatedMessage = await Message.findById(messageId)
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture")
            .populate("reactions.user", "username");

          const reactionUpdate = {
            messageId,
            reactions: populatedMessage.reactions,
          };

          // Emit to both sender and receiver
          const senderSocket = onlineUsers.get(
            populatedMessage.sender._id.toString()
          );
          const receiverSocket = onlineUsers.get(
            populatedMessage.receiver._id.toString()
          );

          if (senderSocket)
            io.to(senderSocket).emit("reaction_update", reactionUpdate);
          if (receiverSocket)
            io.to(receiverSocket).emit("reaction_update", reactionUpdate);
        } catch (error) {
          console.error("Error handling reaction:", error);
        }
      }
    );

        // Handle video call events
        handleVideoCallEvents(socket, io, onlineUsers)

    /**
     * Handle disconnection and mark user offline
     */
    const handleDisconnect = async () => {
      if (!userId) return;

      try {
        onlineUsers.delete(userId);

        // Clear all typing timeouts
        if (typingUsers.has(userId)) {
          const userTyping = typingUsers.get(userId);
          Object.keys(userTyping).forEach((key) => {
            if (key.endsWith("_timeout")) clearTimeout(userTyping[key]);
          });
          typingUsers.delete(userId);
        }

        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        io.emit("user_status", {
          userId,
          isOnline: false,
          lastSeen: new Date(),
        });

        socket.leave(userId);
        console.log(`User ${userId} disconnected`);
      } catch (error) {
        console.error("Error handling disconnection:", error);
      }
    };

    // Disconnect event
    socket.on("disconnect", handleDisconnect);
  });

  // Attach the online user map to the socket server for external use
  io.socketUserMap = onlineUsers;

  return io;
};

module.exports = initializeSocket;
