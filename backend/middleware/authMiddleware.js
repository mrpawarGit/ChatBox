const jwt = require("jsonwebtoken");
const response = require("../utils/responseHandler");

const authMiddleware = (req, res, next) => {
  // Get token from cookies
  const authToken = req.cookies?.auth_token;

  // If token is missing
  if (!authToken) {
    return response(
      res,
      401,
      "Authorization token missing, please provide token"
    );
  }

  try {
    // Verify token using JWT_SECRET
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
    req.user = decoded;
    // console.log(req.user);
    next();
  } catch (error) {
    console.error("JWT verification failed:", error);
    return response(res, 401, "Invalid or expired token");
  }
};

module.exports = authMiddleware;
