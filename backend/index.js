const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectToDB = require("./config/db");
const authRoute = require("./routes/authRoute");
require("dotenv").config();

const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database connection
connectToDB();

// Routes
app.use("/api/auth", authRoute);

// Test route
app.get("/test", (req, res) => {
  res.json({ msg: "API is running" });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ msg: "Not Found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({
    msg: "Something went wrong",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server Running on http://localhost:${PORT}/`);
});
