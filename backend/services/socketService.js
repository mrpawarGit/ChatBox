const { Server, Socket } = require("socket.io");
const UserModel = require("../models/user.model");
const MessageModel = require("../models/message.model");
const { request } = require("express");
require("dotenv").config();

// map to store online users => userID, socketID

const onlineUsers = new Map();

// Map to track typing status => userId => [conversation]:boolean
const typingUsers = new Map();

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    },
    pingTimeout: 60000, // dissconnect inactive user/socket after 60sec
  });

  // when new socket connection established
  io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    let userID = null;

    // handle user connection and mark them online in db
    socket.on("user_connected", async (connectingUserId) => {
      try {
        userID = connectingUserId;
        onlineUsers.set(userID, socket.id);
        socket.join(userID); // join a personal romm for firect emits
        // upadte user status in db
        await UserModel.findByIdAndUpdate(userID, {
          isOnline: true,
          lastSeen: new Date(),
        });

        // notify all users that this user is now online
        io.emit("user_status", { userID, isOnline: true });
      } catch (error) {
        console.log("Error while handling user connection", error);
      }
    });

    // return user status of online or not
    socket.on("get_user_status", (requestedUserId, callback) => {
      const isOnline = onlineUsers.has(requestedUserId);
      callback({
        userID: requestedUserId,
        isOnline,
        lastSeen: isOnline ? new Date() : null,
      });
    });

    // forward message to receiver if online
    socket.io("send_message", async (message) => {
      try {
        const receiverSocketId = onlineUsers.get(message.receiver?._id);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", message);
        }
      } catch (error) {
        console.log("Error Sending Message", error);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    // update message as read and notify sender
    socket.on("message_read", async ({ messageId, senderId }) => {
      try {
        await MessageModel.updateMany(
          { _id: { $in: messageId } },
          { $set: { messageStatus: "read" } }
        );

        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          messageId.forEach((mesgID) => {
            io.to(senderSocketId).emit("message_status_update", {
              messageId,
              messageStatus: "read",
            });
          });
        }
      } catch (error) {
        console.log("Error while updating message read status", error);
      }
    });

    // handle typing start event and auto-stop after 3s
    socket.on("typing_start", ({ conversationId, receiverId }) => {
      if (!userID || !conversationId || !receiverId) return;
      if (!typingUsers.has(userID)) typingUsers.set(userID, {});

      const userTyping = typingUsers.get(userID);
      userTyping[conversationId] = true;

      // clear any exiting timeout
      if (userTyping[`${conversationId}_timeout`]) {
        clearTimeout(userTyping[`${conversationId}_timeout`]);
      }

      // auto stop after 3sec
      userTyping[`${conversationId}_timeout`] = setTimeout(() => {
        userTyping[conversationId] = false;
        socket.to(receiverId).emit("user_typing", {
          userID,
          conversationId,
          isTyping: false,
        });
      }, 3000);

      // notify receiver
      socket.to(receiverId).emit("user_typing", {
        userID,
        conversationId,
        isTyping: true,
      });
    });

    //
    socket.on("typing_stop", ({ conversationId, receiverId }) => {
      if (!userID || !conversationId || !receiverId) return;
      if (!typingUsers.has(userID)) {
        const userTyping = typingUsers.get(userID);
        userTyping[conversationId] = false;

        if (userTyping[`${conversationId}_timeout`]) {
          clearTimeout(userTyping[`${conversationId}_timeout`]);
          delete userTyping[`${conversationId}_timeout`];
        }
      }

      socket.io(receiverId).emit("user_typing", {
        userID,
        conversationId,
        isTyping: false,
      });
    });

    // add or update reaction or message
    socket.io(
      "add_reaction",
      async ({ messageId, emoji, userID, reactionUserId }) => {
        try {
          const message = await MessageModel.findById(messageId);
          if (!message) return;

          const exitingIndex = message.reactions.findIndex(
            (r) => r.user.toString() === reactionUserId
          );

          if (exitingIndex > -1) {
            const exiting = message.reactions(exitingIndex);
            if (exiting.emoji === emoji) {
              // remove same reaction
              message.reactions.splice(exitingIndex, 1);
            } else {
              // chnage emoji
              message.reactions((exitingIndex.emoji = emoji));
            }
          } else {
            // add new reaction
            message.reactions.push({ user: reactionUserId, emoji });
          }
          await message.save();

          const populatedMessage = await MessageModel.findOne(message?._id)
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture")
            .populate("reactions.user", "username");

          const reactionUpdated = {
            messageId,
            reactions: populatedMessage.reactions,
          };

          const senderSocket = onlineUsers.get(
            populatedMessage.sender._id.toString()
          );

          const receiverSocket = onlineUsers.get(
            populatedMessage.receiver._id.toString()
          );

          if (senderSocket)
            io.to(senderSocket).emit("reaction_update", reactionUpdated);
          if (receiverSocket)
            io.to(receiverSocket).emit("reaction_update", reactionUpdated);
        } catch (error) {
          console.log("Error handling recations", error);
        }
      }
    );

    // handle dissconnection and mark user offline
    const handleDisconnected = async () => {
      if (!userID) return;

      try {
        onlineUsers.delete(userID);
        // clear all typing timeouts
        if (typingUsers.has(userID)) {
          const userTyping = typingUsers.get(userID);
          Object.keys(userTyping).forEach((key) => {
            if (key.endsWith("_timeout")) clearTimeout(userTyping[key]);
          });

          typingUsers.delete(userID);
        }

        await UserModel.findByIdAndUpdate(userID, {
          isOnline: false,
          lastSeen: new Date(),
        });

        io.emit("user_status", {
          userID,
          isOnline: false,
          lastSeen: new Date(),
        });

        socket.leave(userID);
        console.log(`User ${userID} disconnected`);
      } catch (error) {
        console.log("Error Handling disconnection", error);
      }
    };

    // disconnect event

    socket.on("disconnect", handleDisconnected);
  });

  // attach the online user map to socket for external use
  io.socketUserMap = onlineUsers;

  return io;
};

module.exports = initializeSocket;
