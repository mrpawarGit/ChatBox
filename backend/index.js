const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectToDB = require("./config/db");
require("dotenv").config();

const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(express.json()); // for parsing application/json

// Database connection
connectToDB();

// Test route
app.get("/test", (req, res) => {
  res.json({ msg: "API is running" });
});

// 404 handler (for unknown routes)
app.use((req, res, next) => {
  res.status(404).json({ msg: "Not Found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({ msg: "Something went wrong", error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server Running on http://localhost:${PORT}/`);
});
