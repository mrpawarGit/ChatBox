const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const chatController = require('../controllers/chatController');
const authenticate = require('../middlerwares/authMiddleware');
const { multerMiddleware } = require('../../config/cloudinaryConfig');

const router = express.Router();

router.post('/send-message',authenticate, multerMiddleware,chatController.sendMessage)

router.get('/conversations', authenticate, chatController.getConversations);
router.get('/conversations/:conversationId/messages', authenticate, chatController.getMessages);
router.put('/messages/read', authenticate, chatController.markAsRead);
router.delete('/messages/:messageId', authenticate, chatController.deleteMessage);

module.exports = router;
