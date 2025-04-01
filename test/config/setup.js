/**
 * Test setup configuration
 * 
 * Configures the testing environment, including:
 * - Database connection
 * - Test utilities
 * - Global before/after hooks
 */

const mongoose = require('mongoose');
const chai = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const { clearDatabase, disconnect } = require('../utils/db-cleaner');

// Configure environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// Database helper functions
const dbHelper = {
  /**
   * Connects to the test database
   */
  connect: async () => {
    try {
      const dbUri = process.env.TEST_DB_URI || 'mongodb://localhost:27017/advenro-test';
      
      // Check if mongoose is already connected
      if (mongoose.connection.readyState === 1) {
        // If already connected to same URI, just return
        if (mongoose.connection.host === 'localhost' && 
            mongoose.connection.port === '27017' && 
            mongoose.connection.name === 'advenro-test') {
          console.log('Already connected to test database');
          return;
        }
        // If connected to a different URI, disconnect first
        await mongoose.disconnect();
        console.log('Disconnected from previous database connection');
      }
      
      await mongoose.connect(dbUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      
      console.log(`Connected to test database: ${dbUri}`);
    } catch (error) {
      console.error('Error connecting to test database:', error);
      throw error;
    }
  },
  
  /**
   * Disconnects from the test database
   */
  disconnect: async () => {
    await disconnect();
  },
  
  /**
   * Clears all collections in the database
   */
  clearDatabase: async () => {
    await clearDatabase();
  }
};

// Token helper functions
const tokenHelper = {
  /**
   * Generates a JWT token for testing
   * @param {Object} payload - Payload to include in token
   * @returns {string} JWT token
   */
  generateToken: (payload) => {
    return jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }
};

// Set up global before hooks
before(async function() {
  this.timeout(10000); // Increase timeout for database connection
  await dbHelper.connect();
});

// Set up global after hooks
after(async function() {
  await dbHelper.disconnect();
});

// Set up hooks for each test suite
beforeEach(async function() {
  // Add any setup needed before each test
});

afterEach(async function() {
  // Clean up after each test
  sinon.restore();
});

// Export utilities for use in tests
module.exports = {
  mongoose,
  expect: chai.expect,
  sinon,
  dbHelper,
  tokenHelper
}; 