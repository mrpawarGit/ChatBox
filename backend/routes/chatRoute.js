const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { multerMiddleware } = require("../config/cloudinaryConfig");
const {
  sendMessage,
  getConversation,
  getMessages,
  markAsRead,
  deleteMessage,
} = require("../controllers/chatController");

const router = express.Router();

// protected route
router.post("/send-message", authMiddleware, multerMiddleware, sendMessage);
router.get("/coversations", authMiddleware, getConversation);
router.get(
  "/coversations/:conversationId/messages",
  authMiddleware,
  getMessages
);

router.put("/messages/read", authMiddleware, markAsRead);
router.delete("/messages/:messageId", authMiddleware, deleteMessage);

module.exports = router;
