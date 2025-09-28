const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { multerMiddleware } = require("../config/cloudinaryConfig");
const {
  createStatus,
  getStatus,
  deleteStatus,
  viewStatus,
} = require("../controllers/statusController");

const router = express.Router();

// protected route
router.post("/", authMiddleware, multerMiddleware, createStatus);
router.get("/coversations", authMiddleware, getStatus);
router.put("/:statusId/view", authMiddleware, viewStatus);
router.delete("/:statusId", authMiddleware, deleteStatus);

module.exports = router;
