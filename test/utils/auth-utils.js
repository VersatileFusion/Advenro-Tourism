const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * Generate a mock JWT token for testing
 * @param {Object} payload - The payload to include in the token
 * @param {String} secret - The secret key to sign the token with
 * @param {Object} options - JWT options
 * @returns {String} - JWT token
 */
function generateMockToken(payload = {}, secret = 'test-secret', options = {}) {
  const defaultPayload = {
    id: 'user123',
    email: 'test@example.com',
    role: 'user',
    ...payload
  };
  
  const defaultOptions = {
    expiresIn: '1h',
    ...options
  };
  
  return jwt.sign(defaultPayload, secret, defaultOptions);
}

/**
 * Create mock authentication middleware for testing
 * @param {Object} user - User object to attach to req.user
 * @returns {Function} - Express middleware function
 */
function mockAuthMiddleware(user = { id: 'user123', email: 'test@example.com', role: 'user' }) {
  return (req, res, next) => {
    req.user = user;
    next();
  };
}

/**
 * Mock user authentication for tests
 * @param {Object} app - Express app
 * @param {Object} user - User object to use for authentication
 */
function setupMockAuth(app, user = { id: 'user123', email: 'test@example.com', role: 'user' }) {
  app.use((req, res, next) => {
    req.user = user;
    next();
  });
}

/**
 * Hash a password for testing
 * @param {String} password - Plain text password
 * @returns {Promise<String>} - Hashed password
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password hash
 * @param {String} password - Plain text password
 * @param {String} hash - Hashed password
 * @returns {Promise<Boolean>} - Whether the password matches the hash
 */
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = {
  generateMockToken,
  mockAuthMiddleware,
  setupMockAuth,
  hashPassword,
  verifyPassword
}; 