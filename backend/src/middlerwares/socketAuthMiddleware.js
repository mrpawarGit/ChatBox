const jwt = require("jsonwebtoken");

const socketAuthMiddleware = (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers['authorization']?.split(' ')[1];

    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // Attach decoded user to socket
    next();
  } catch (error) {
    return next(new Error("Invalid or expired token"));
  }
};

module.exports = socketAuthMiddleware;
