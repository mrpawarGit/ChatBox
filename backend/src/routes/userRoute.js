const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const userController = require('../controllers/userController');
const authMiddleware = require('../middlerwares/authMiddleware');
const { multerMiddleware } = require('../../config/cloudinaryConfig');

const router = express.Router();

router.post('/send-otp', userController.sendOtp);
router.post('/verify-otp', userController.verifyOtp);
router.put('/update-profile', authMiddleware, multerMiddleware,userController.updateProfile);
router.get('/check-auth',authMiddleware,userController.checkAuthenticated)
router.get('/other-users-list',authMiddleware,userController.getAllUsers)

router.get('/logout',authMiddleware,userController.logout)

module.exports = router;
