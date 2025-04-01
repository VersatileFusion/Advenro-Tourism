/**
 * Standard response format utility
 * Creates consistent API responses in a structure the frontend expects
 */

/**
 * Format a success response
 * @param {Object} data - The data to return
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} - Formatted response object
 */
exports.successResponse = (
  data = null,
  message = "Operation successful",
  statusCode = 200
) => {
  return {
    success: true,
    message,
    status: statusCode,
    data,
  };
};

/**
 * Format an error response
 * @param {string} error - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} - Formatted error object
 */
exports.errorResponse = (error = "Something went wrong", statusCode = 500) => {
  return {
    success: false,
    error,
    status: statusCode,
    data: null,
  };
};

/**
 * Send a formatted success response
 * @param {Object} res - Express response object
 * @param {Object} data - The data to return
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
exports.sendSuccessResponse = (
  res,
  data = null,
  message = "Operation successful",
  statusCode = 200
) => {
  return res
    .status(statusCode)
    .json(this.successResponse(data, message, statusCode));
};

/**
 * Send a formatted error response
 * @param {Object} res - Express response object
 * @param {string} error - Error message
 * @param {number} statusCode - HTTP status code
 */
exports.sendErrorResponse = (
  res,
  error = "Something went wrong",
  statusCode = 500
) => {
  return res.status(statusCode).json(this.errorResponse(error, statusCode));
};
