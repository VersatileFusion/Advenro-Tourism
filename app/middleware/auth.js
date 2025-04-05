/**
 * Authentication Middleware
 * Handles JWT authentication and user role verification
 */

const jwt = require('jsonwebtoken');

// Mock JWT secret (in a real app, this would be in environment variables)
const JWT_SECRET = 'your-secret-key';

// Mock admin users for role checking
const adminUsers = ['admin1'];

/**
 * Authenticate JWT token middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticateJWT = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. No token provided.'
    });
  }
  
  // Extract token (remove 'Bearer ' prefix)
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Invalid token format.'
    });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token expired.'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Invalid token.'
    });
  }
};

/**
 * Check if user has admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const isAdmin = (req, res, next) => {
  // Check if user exists in request (set by authenticateJWT)
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
  
  // Check if user has admin role
  if (req.user.role === 'admin' || adminUsers.includes(req.user.id)) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
};

module.exports = {
  authenticateJWT,
  isAdmin
}; 