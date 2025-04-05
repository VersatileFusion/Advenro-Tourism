/**
 * Authentication Middleware
 * Validates JWT tokens and adds user info to request
 */
const jwt = require('jsonwebtoken');

// Secret key for JWT - in a real app, this would be in environment variables
const JWT_SECRET = 'your-secret-key';

/**
 * Middleware to authenticate JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = (req, res, next) => {
  // Get token from headers
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check if it starts with "Bearer "
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Invalid authentication format' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware to check if user is an admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({ error: 'Access denied. Admin role required' });
  }
  
  next();
};

/**
 * Middleware to authorize based on user roles
 * @param {Array} roles - Array of roles that are allowed to access the route
 * @returns {Function} - Express middleware function
 */
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        requiredRoles: roles 
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  isAdmin,
  authorize
}; 