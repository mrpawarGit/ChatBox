const jwt = require('jsonwebtoken');
const response = require('../../utils/responseHandler');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const authToken = req.cookies?.auth_token;
  if (!authToken) {
    return response(res, 401, 'Authorization token missing or malformed');
  }

  // Expected format: "Bearer <token>"
  // if (!authHeader || !authHeader.startsWith('Bearer ')) {
  //   return response(res, 401, 'Authorization token missing or malformed');
  // }

  // const token = authHeader.split(' ')[1]; // get the token part

  try {
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
    return response(res, 401, 'Invalid or expired token');
  }
};

module.exports = authMiddleware;
