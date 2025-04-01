const { expect } = require('chai');
const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');

describe('Error Handling Middleware Integration Tests', function() {
  let app;
  
  // Set up express app with error middleware before tests
  beforeEach(() => {
    app = express();
    
    // Add middleware to properly parse Accept headers
    app.use((req, res, next) => {
      // Override the accepts method for testing purposes
      const originalAccepts = req.accepts;
      req.accepts = function(type) {
        // Check if request explicitly asks for HTML (for test purposes)
        if (this.get('Accept') === 'text/html') {
          return type === 'html';
        }
        // Default to not accepting HTML for API requests
        if (type === 'html' && this.path.startsWith('/api/')) {
          return false;
        }
        // Use original accepts method for other cases
        return originalAccepts.call(this, type);
      };
      next();
    });
    
    // Create some test routes that will throw different types of errors
    app.get('/api/error/validation', (req, res, next) => {
      const error = new Error('Validation Failed');
      error.name = 'ValidationError';
      error.errors = {
        name: { message: 'Name is required' },
        email: { message: 'Email must be valid' }
      };
      next(error);
    });
    
    app.get('/api/error/duplicate', (req, res, next) => {
      const error = new Error('Duplicate Key');
      error.code = 11000;
      error.keyValue = { email: 'existing@example.com' };
      next(error);
    });
    
    app.get('/api/error/jwt', (req, res, next) => {
      const error = new Error('Invalid Token');
      error.name = 'JsonWebTokenError';
      next(error);
    });
    
    app.get('/api/error/jwt-expired', (req, res, next) => {
      const error = new Error('Token Expired');
      error.name = 'TokenExpiredError';
      next(error);
    });
    
    app.get('/api/error/multer', (req, res, next) => {
      const error = new Error('File too large');
      error.name = 'MulterError';
      next(error);
    });
    
    app.get('/api/error/notfound', (req, res, next) => {
      const error = new Error('Resource not found');
      error.status = 404;
      next(error);
    });
    
    app.get('/api/error/custom', (req, res, next) => {
      const error = new Error('Custom Error');
      error.status = 422;
      next(error);
    });
    
    app.get('/api/error/default', (req, res, next) => {
      throw new Error('Something went wrong');
    });
    
    // Setup simple HTML route
    app.get('/error/html', (req, res, next) => {
      const error = new Error('HTML Error');
      error.status = 500;
      next(error);
    });
    
    // Add a 404 middleware for undefined routes
    app.use((req, res, next) => {
      const error = new Error('Route not found');
      error.status = 404;
      next(error);
    });
    
    // Add the error handling middleware
    app.use((err, req, res, next) => {
      console.error('❌ Error:', err.stack);

      // Check if the request accepts HTML
      const acceptsHtml = req.accepts('html');

      // Handle HTML requests differently
      if (acceptsHtml) {
          // Determine status code
          const statusCode = err.status || 500;
          
          // For testing purposes, we'll just send a simple response
          // instead of serving actual HTML files
          if (statusCode === 404) {
              return res.status(404).send('404 - Not Found');
          } else {
              return res.status(500).send('500 - Server Error');
          }
      }

      // For API requests, return JSON responses
      // Mongoose validation error
      if (err.name === 'ValidationError') {
          return res.status(400).json({
              success: false,
              message: 'Validation error',
              errors: Object.values(err.errors).map(error => error.message)
          });
      }

      // Mongoose duplicate key error
      if (err.code === 11000) {
          return res.status(400).json({
              success: false,
              message: 'Duplicate field value entered',
              errors: Object.keys(err.keyValue).map(key => `${key} already exists`)
          });
      }

      // JWT error
      if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({
              success: false,
              message: 'Invalid token'
          });
      }

      if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
              success: false,
              message: 'Token expired'
          });
      }

      // Multer error
      if (err.name === 'MulterError') {
          return res.status(400).json({
              success: false,
              message: 'File upload error',
              errors: [err.message]
          });
      }

      // Default error
      res.status(err.status || 500).json({
          success: false,
          message: err.message || 'Internal server error'
      });
    });
  });
  
  it('should handle validation errors', async () => {
    const res = await request(app)
      .get('/api/error/validation')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
    
    expect(res.body.success).to.be.false;
    expect(res.body.message).to.equal('Validation error');
    expect(res.body.errors).to.include('Name is required');
    expect(res.body.errors).to.include('Email must be valid');
  });
  
  it('should handle duplicate key errors', async () => {
    const res = await request(app)
      .get('/api/error/duplicate')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
    
    expect(res.body.success).to.be.false;
    expect(res.body.message).to.equal('Duplicate field value entered');
    expect(res.body.errors).to.include('email already exists');
  });
  
  it('should handle JWT errors', async () => {
    const res = await request(app)
      .get('/api/error/jwt')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(401);
    
    expect(res.body.success).to.be.false;
    expect(res.body.message).to.equal('Invalid token');
  });
  
  it('should handle expired JWT errors', async () => {
    const res = await request(app)
      .get('/api/error/jwt-expired')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(401);
    
    expect(res.body.success).to.be.false;
    expect(res.body.message).to.equal('Token expired');
  });
  
  it('should handle Multer errors', async () => {
    const res = await request(app)
      .get('/api/error/multer')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
    
    expect(res.body.success).to.be.false;
    expect(res.body.message).to.equal('File upload error');
    expect(res.body.errors).to.include('File too large');
  });
  
  it('should handle 404 errors for API routes', async () => {
    const res = await request(app)
      .get('/api/error/notfound')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(404);
    
    expect(res.body.success).to.be.false;
    expect(res.body.message).to.equal('Resource not found');
  });
  
  it('should handle custom status code errors', async () => {
    const res = await request(app)
      .get('/api/error/custom')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(422);
    
    expect(res.body.success).to.be.false;
    expect(res.body.message).to.equal('Custom Error');
  });
  
  it('should handle default server errors', async () => {
    const res = await request(app)
      .get('/api/error/default')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(500);
    
    expect(res.body.success).to.be.false;
    expect(res.body.message).to.equal('Something went wrong');
  });
  
  it('should handle undefined routes as 404', async () => {
    const res = await request(app)
      .get('/api/nonexistent/route')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(404);
    
    expect(res.body.success).to.be.false;
    expect(res.body.message).to.equal('Route not found');
  });
  
  it('should handle HTML requests with text responses', async () => {
    const res = await request(app)
      .get('/error/html')
      .set('Accept', 'text/html')
      .expect(500);
    
    expect(res.text).to.equal('500 - Server Error');
  });
}); 