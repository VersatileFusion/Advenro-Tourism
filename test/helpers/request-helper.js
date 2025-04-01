const request = require('supertest');
const app = require('../../src/server/app');

/**
 * Make a GET request to the API
 * @param {string} endpoint - API endpoint
 * @param {string} token - JWT token (optional)
 * @returns {Promise} - Supertest request
 */
const getRequest = (endpoint, token = null) => {
  const req = request(app).get(endpoint);
  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }
  return req;
};

/**
 * Make a POST request to the API
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body
 * @param {string} token - JWT token (optional)
 * @returns {Promise} - Supertest request
 */
const postRequest = (endpoint, data = {}, token = null) => {
  const req = request(app).post(endpoint).send(data);
  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }
  return req;
};

/**
 * Make a PUT request to the API
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body
 * @param {string} token - JWT token (optional)
 * @returns {Promise} - Supertest request
 */
const putRequest = (endpoint, data = {}, token = null) => {
  const req = request(app).put(endpoint).send(data);
  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }
  return req;
};

/**
 * Make a DELETE request to the API
 * @param {string} endpoint - API endpoint
 * @param {string} token - JWT token (optional)
 * @returns {Promise} - Supertest request
 */
const deleteRequest = (endpoint, token = null) => {
  const req = request(app).delete(endpoint);
  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }
  return req;
};

/**
 * Make a PATCH request to the API
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body
 * @param {string} token - JWT token (optional)
 * @returns {Promise} - Supertest request
 */
const patchRequest = (endpoint, data = {}, token = null) => {
  const req = request(app).patch(endpoint).send(data);
  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }
  return req;
};

module.exports = {
  getRequest,
  postRequest,
  putRequest,
  deleteRequest,
  patchRequest
}; 