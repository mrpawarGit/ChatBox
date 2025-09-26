const response = (res, statusCode, message, data = {}) => {
  if (!res) {
    console.error("Response object is null");
    return;
  }

  const responseObject = {
    status: statusCode < 400 ? "success" : "error",
    message,
    data,
  };

  return res.status(statusCode).json(responseObject);
};

module.exports = response;
