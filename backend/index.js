const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectToDB = require("./config/db");
const authRoute = require("./routes/authRoute");
const chatRoute = require("./routes/chatRoute");
const statusRoute = require("./routes/statusRoute");
const bodyParser = require("body-parser");
const initializeSocket = require("./services/socketService");
const http = require("http");
require("dotenv").config();

const PORT = process.env.PORT || 3000;
const app = express();

// cors
const corsOption = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
};

app.use(cors(corsOption));

// Middleware setup
app.use(cors()); // Enable cors
app.use(express.json()); // Parse JSON requests
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded form data
app.use(cookieParser()); // Parse cookies from incoming requests

// create server
const server = http.createServer(app);

const io = initializeSocket(server);

// apply socket middleware before routes
app.use((req, res, next) => {
  req.io = io;
  req.socketUserMap = io.socketUserMap;
  next();
});

// Connect to MongoDB
connectToDB();

// routes
app.use("/api/auth", authRoute);
app.use("/api/chat", chatRoute);
app.use("/api/status", statusRoute);

// Test route to check if server is running
app.get("/test", (req, res) => {
  res.json({ msg: "API is running" });
});

// 404 handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({ msg: "Not Found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({
    msg: "Something went wrong",
    // Only show detailed error in development
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// server
server.listen(PORT, () => {
  console.log(`Server Running on http://localhost:${PORT}/`);
});
