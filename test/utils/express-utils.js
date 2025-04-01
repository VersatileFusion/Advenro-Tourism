const express = require('express');
const bodyParser = require('body-parser');
const { mockAuthMiddleware } = require('./auth-utils');

/**
 * Create a minimal Express app for testing
 * @returns {Object} - Express app
 */
function createTestApp() {
  const app = express();
  
  // Middleware
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  
  return app;
}

/**
 * Add test routes to an Express app
 * @param {Object} app - Express app
 * @param {Object} routes - Object with route handlers
 * @param {Boolean} requireAuth - Whether routes require authentication
 * @param {Object} user - User object for auth middleware
 */
function addTestRoutes(app, routes, requireAuth = false, user = { id: 'user123' }) {
  // Apply auth middleware if required
  if (requireAuth) {
    app.use(mockAuthMiddleware(user));
  }
  
  // Register routes
  Object.keys(routes).forEach(route => {
    const [method, path] = route.split(' ');
    
    app[method.toLowerCase()](path, routes[route]);
  });
  
  // Add 404 handler
  app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });
  
  // Add error handler
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      error: {
        message: err.message || 'Internal Server Error'
      }
    });
  });
  
  return app;
}

/**
 * Create an Express router for testing
 * @param {Object} routes - Object with route handlers
 * @returns {Object} - Express router
 */
function createTestRouter(routes) {
  const router = express.Router();
  
  // Register routes
  Object.keys(routes).forEach(route => {
    const [method, path] = route.split(' ');
    
    router[method.toLowerCase()](path, routes[route]);
  });
  
  return router;
}

/**
 * Create a complete test API with routes for testing
 * @param {Object} routeGroups - Object with route groups
 * @param {Object} middlewares - Object with middleware functions
 * @returns {Object} - Express app
 */
function createTestApi(routeGroups = {}, middlewares = {}) {
  const app = createTestApp();
  
  // Apply global middlewares
  Object.keys(middlewares).forEach(middleware => {
    app.use(middlewares[middleware]);
  });
  
  // Register route groups with their specific middlewares
  Object.keys(routeGroups).forEach(prefix => {
    const router = createTestRouter(routeGroups[prefix]);
    app.use(`/api/${prefix}`, router);
  });
  
  // Add catch-all routes
  app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });
  
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      error: {
        message: err.message || 'Internal Server Error'
      }
    });
  });
  
  return app;
}

module.exports = {
  createTestApp,
  addTestRoutes,
  createTestRouter,
  createTestApi
}; 