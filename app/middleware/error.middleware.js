/**
 * Error Handling Middleware
 * Standardizes API error responses
 */
const errorHandler = (err, req, res, next) => {
  // Default error status and message
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';
  let code = err.code || 'SERVER_ERROR';
  let details = err.details || null;
  
  // Log the error (in production, would use a proper logging service)
  console.error(`[ERROR] ${code} - ${message}`, err);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    code = 'VALIDATION_ERROR';
    details = err.errors;
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    code = 'UNAUTHORIZED';
  } else if (err.name === 'ForbiddenError') {
    status = 403;
    code = 'FORBIDDEN';
  } else if (err.name === 'NotFoundError') {
    status = 404;
    code = 'NOT_FOUND';
  }
  
  // Return standardized error response
  res.status(status).json({
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = errorHandler; 