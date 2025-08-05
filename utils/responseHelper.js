const sendSuccess = (res, data, message = "Success", statusCode = 200) => {
  res.status(200).json({
    success: true,
    message,
    data,
  });
};

const sendError = (
  res,
  error = null,
  statusCode = 500,
  message = "An error occurred"
) => {
  console.log(`Error: ${message}`, error);
  res.status(statusCode).json({
    success: false,
    message,
    error: error instanceof Error ? error.message : error,
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
