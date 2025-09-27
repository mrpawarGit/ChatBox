const express = require("express");
const {
  sendOtp,
  verifyOtp,
  updateProfile,
  logout,
  checkAuthenticated,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const { multerMiddleware } = require("../config/cloudinaryConfig");

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.get("/logout", logout);

// protected route
router.put("/update-profile", authMiddleware, multerMiddleware, updateProfile);
router.get("/check-auth", authMiddleware, checkAuthenticated);

module.exports = router;
