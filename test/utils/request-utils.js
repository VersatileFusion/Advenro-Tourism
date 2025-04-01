const supertest = require('supertest');
const { generateMockToken } = require('./auth-utils');

/**
 * Create a supertest client with authentication
 * @param {Object} app - Express app
 * @param {Object} user - User object for token generation
 * @returns {Object} - Supertest client with auth headers
 */
function authenticatedRequest(app, user = { id: 'user123' }) {
  const token = generateMockToken(user);
  return supertest(app).set('Authorization', `Bearer ${token}`);
}

/**
 * Create an admin supertest client
 * @param {Object} app - Express app
 * @returns {Object} - Supertest client with admin auth headers
 */
function adminRequest(app) {
  const adminUser = { id: 'admin123', role: 'admin' };
  return authenticatedRequest(app, adminUser);
}

/**
 * Create a guest supertest client (no auth)
 * @param {Object} app - Express app
 * @returns {Object} - Supertest client without auth headers
 */
function guestRequest(app) {
  return supertest(app);
}

/**
 * Helper to simplify request testing patterns
 * @param {Object} app - Express app
 * @returns {Object} - Object with request methods
 */
function createRequestHelpers(app) {
  return {
    /**
     * Make an authenticated GET request
     * @param {String} url - URL to request
     * @param {Object} user - User object (optional)
     * @returns {Promise} - Supertest response
     */
    getAsUser: (url, user) => authenticatedRequest(app, user).get(url),
    
    /**
     * Make an authenticated POST request
     * @param {String} url - URL to request
     * @param {Object} data - Request body
     * @param {Object} user - User object (optional)
     * @returns {Promise} - Supertest response
     */
    postAsUser: (url, data, user) => authenticatedRequest(app, user).post(url).send(data),
    
    /**
     * Make an authenticated PUT request
     * @param {String} url - URL to request
     * @param {Object} data - Request body
     * @param {Object} user - User object (optional)
     * @returns {Promise} - Supertest response
     */
    putAsUser: (url, data, user) => authenticatedRequest(app, user).put(url).send(data),
    
    /**
     * Make an authenticated DELETE request
     * @param {String} url - URL to request
     * @param {Object} user - User object (optional)
     * @returns {Promise} - Supertest response
     */
    deleteAsUser: (url, user) => authenticatedRequest(app, user).delete(url),
    
    /**
     * Make an admin GET request
     * @param {String} url - URL to request
     * @returns {Promise} - Supertest response
     */
    getAsAdmin: (url) => adminRequest(app).get(url),
    
    /**
     * Make an admin POST request
     * @param {String} url - URL to request
     * @param {Object} data - Request body
     * @returns {Promise} - Supertest response
     */
    postAsAdmin: (url, data) => adminRequest(app).post(url).send(data),
    
    /**
     * Make an admin PUT request
     * @param {String} url - URL to request
     * @param {Object} data - Request body
     * @returns {Promise} - Supertest response
     */
    putAsAdmin: (url, data) => adminRequest(app).put(url).send(data),
    
    /**
     * Make an admin DELETE request
     * @param {String} url - URL to request
     * @returns {Promise} - Supertest response
     */
    deleteAsAdmin: (url) => adminRequest(app).delete(url),
    
    /**
     * Make an unauthenticated GET request
     * @param {String} url - URL to request
     * @returns {Promise} - Supertest response
     */
    getAsGuest: (url) => guestRequest(app).get(url),
    
    /**
     * Make an unauthenticated POST request
     * @param {String} url - URL to request
     * @param {Object} data - Request body
     * @returns {Promise} - Supertest response
     */
    postAsGuest: (url, data) => guestRequest(app).post(url).send(data)
  };
}

module.exports = {
  authenticatedRequest,
  adminRequest,
  guestRequest,
  createRequestHelpers
}; 