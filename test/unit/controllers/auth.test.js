/**
 * Controller Test Template using Proxyquire
 * 
 * This template creates tests for a controller using proxyquire to mock dependencies.
 * It follows best practices for isolating controller tests from database and external dependencies.
 * 
 * How to use:
 * 1. Generate a test file with the generator script: node scripts/generate-test.js controller yourControllerName
 * 2. Add/modify mock behaviors as needed for your specific controller
 * 3. Add tests for specific controller functions you need to test
 * 
 * Important placeholders:
 * - Auth - capitalized model name (e.g., User, Booking)
 * - ../../../src/controllers/authController - path to the controller (e.g., ../../../src/controllers/userController)
 * - authController - name of the controller variable (e.g., userController)
 * - getAllAuths - name of the method to get all resources (e.g., getAllUsers)
 * - getAuth - name of the method to get a single resource (e.g., getUser)
 * - createAuth - name of the method to create a resource (e.g., createUser)
 * - updateAuth - name of the method to update a resource (e.g., updateUser)
 * - deleteAuth - name of the method to delete a resource (e.g., deleteUser)
 */

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const proxyquire = require('proxyquire');

// Import test setup
const { dbHelper } = require('../../config/setup');

// Create model mocks
const UserMock = {
  findById: sinon.stub().resolves({
    _id: new ObjectId(),
    name: 'Test User',
    email: 'test@example.com'
  }),
  findOne: sinon.stub().resolves({
    _id: new ObjectId(),
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword',
    getSignedJwtToken: sinon.stub().returns('test-token'),
    matchPassword: sinon.stub().resolves(true)
  })
};

// Mock the asyncHandler middleware
const asyncHandlerMock = fn => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

// Mock the express-validator
const validationResultMock = {
  isEmpty: sinon.stub().returns(true),
  array: sinon.stub().returns([])
};

const expressValidatorMock = {
  validationResult: () => validationResultMock
};

// Mock jwt
const jwtMock = {
  sign: sinon.stub().returns('test-token'),
  verify: sinon.stub().returns({ id: new ObjectId().toString() })
};

// Mock bcrypt
const bcryptMock = {
  compare: sinon.stub().resolves(true)
};

// Mock dependencies
const mockDependencies = {
  '../models': { User: UserMock },
  '../middleware/async': asyncHandlerMock,
  'express-validator': expressValidatorMock,
  'jsonwebtoken': jwtMock,
  'bcryptjs': bcryptMock
};

// Import the controller with mocked dependencies
const authController = proxyquire('../../../src/controllers/authController', mockDependencies);

describe('Auth Controller Tests', function() {
  // Setup hooks
  before(async function() {
    // Connect to test database if not already connected
    if (mongoose.connection.readyState !== 1) {
      await dbHelper.connect();
    }
  });

  after(async function() {
    // No need to disconnect here as the global after hook will handle it
  });

  // Test the controller's existence and functions
  describe('Controller Interface', () => {
    it('should exist and export expected functions', () => {
      expect(authController).to.be.an('object');
      // Add actual functions from the controller
      expect(authController.login).to.be.a('function');
      expect(authController.register).to.be.a('function');
      // More functions may exist, add as needed
    });
  });
}); 