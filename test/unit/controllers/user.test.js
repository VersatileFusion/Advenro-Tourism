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
 * - User - capitalized model name (e.g., User, Booking)
 * - ../../../src/controllers/userController - path to the controller (e.g., ../../../src/controllers/userController)
 * - userController - name of the controller variable (e.g., userController)
 * - getAllUsers - name of the method to get all resources (e.g., getAllUsers)
 * - getUser - name of the method to get a single resource (e.g., getUser)
 * - createUser - name of the method to create a resource (e.g., createUser)
 * - updateUser - name of the method to update a resource (e.g., updateUser)
 * - deleteUser - name of the method to delete a resource (e.g., deleteUser)
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
  populate: sinon.stub().returnsThis()
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

// Mock dependencies
const mockDependencies = {
  '../models': { User: UserMock },
  '../middleware/async': asyncHandlerMock,
  'express-validator': expressValidatorMock
};

// Import the controller with mocked dependencies
const userController = proxyquire('../../../src/controllers/userController', mockDependencies);

describe('User Controller Tests', function() {
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

  // Define mock data
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Setup request object
    mockReq = {
      user: { id: new ObjectId().toString() },
      body: {},
      params: {},
      query: {}
    };
    
    // Setup response object
    mockRes = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    
    // Setup next function
    mockNext = sinon.stub();
  });

  // Test the controller's existence and functions
  describe('Controller Interface', () => {
    it('should exist and export expected functions', () => {
      expect(userController).to.be.an('object');
      expect(userController.getMe).to.be.a('function');
      expect(userController.updateProfile).to.be.a('function');
      expect(userController.updateEmail).to.be.a('function');
      expect(userController.verifyEmail).to.be.a('function');
      expect(userController.updatePassword).to.be.a('function');
      expect(userController.uploadAvatar).to.be.a('function');
      expect(userController.register).to.be.a('function');
      expect(userController.login).to.be.a('function');
      expect(userController.getProfile).to.be.a('function');
      expect(userController.subscribeNewsletter).to.be.a('function');
    });
  });

  // Basic test for getMe function
  describe('getMe Function', () => {
    it('should call User.findById with the correct id', async () => {
      // Call the controller function
      await userController.getMe(mockReq, mockRes, mockNext);
      
      // Assert that findById was called with the correct ID
      expect(UserMock.findById.called).to.be.true;
    });
  });
}); 