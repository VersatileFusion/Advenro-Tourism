const jwt = require('jsonwebtoken');
const config = require('../../src/server/config/config');

/**
 * Helper function to generate valid JWT tokens for testing
 */
const tokenHelper = {
  /**
   * Generate a valid user token
   * @param {Object} user - User object with at least userId and role
   * @param {String} user.userId - User ID
   * @param {String} user.role - User role (user, admin)
   * @param {Number} expiresIn - Token expiration in seconds (default: 1 hour)
   * @returns {String} JWT token
   */
  generateToken(user, expiresIn = 3600) {
    return jwt.sign(
      { 
        userId: user.userId || user._id, 
        role: user.role || 'user' 
      },
      config.jwtSecret,
      { expiresIn }
    );
  },

  /**
   * Generate an expired token for testing token expiration
   * @param {Object} user - User object with at least userId and role
   * @returns {String} Expired JWT token
   */
  generateExpiredToken(user) {
    return jwt.sign(
      { 
        userId: user.userId || user._id, 
        role: user.role || 'user' 
      },
      config.jwtSecret,
      { expiresIn: -10 } // Expired 10 seconds ago
    );
  },

  /**
   * Generate token with invalid signature
   * @param {Object} user - User object with at least userId and role
   * @returns {String} JWT token with invalid signature
   */
  generateInvalidToken(user) {
    return jwt.sign(
      { 
        userId: user.userId || user._id, 
        role: user.role || 'user' 
      },
      'wrong-secret',
      { expiresIn: 3600 }
    );
  },

  /**
   * Verify and decode a token
   * @param {String} token - JWT token
   * @returns {Object} Decoded token payload
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwtSecret);
    } catch (error) {
      return { error: error.message };
    }
  }
};

module.exports = tokenHelper; 