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
 * - LocalService - capitalized model name (e.g., User, Booking)
 * - ../../../src/controllers/localServiceController - path to the controller (e.g., ../../../src/controllers/userController)
 * - localServiceController - name of the controller variable (e.g., userController)
 * - getAllLocalServices - name of the method to get all resources (e.g., getAllUsers)
 * - getLocalService - name of the method to get a single resource (e.g., getUser)
 * - createLocalService - name of the method to create a resource (e.g., createUser)
 * - updateLocalService - name of the method to update a resource (e.g., updateUser)
 * - deleteLocalService - name of the method to delete a resource (e.g., deleteUser)
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
const LocalServiceMock = {
  findById: sinon.stub(),
  findOne: sinon.stub(),
  find: sinon.stub(),
  create: sinon.stub(),
  findByIdAndUpdate: sinon.stub(),
  findByIdAndDelete: sinon.stub(),
  countDocuments: sinon.stub(),
  aggregate: sinon.stub()
};

const ErrorLogMock = {
  create: sinon.stub()
};

// Mock the express-validator
const validationResultMock = {
  isEmpty: sinon.stub().returns(true),
  array: sinon.stub().returns([])
};

const expressValidatorMock = {
  validationResult: () => validationResultMock
};

// Import the controller with mocked dependencies
const modelsMock = {
  '../models/LocalService': LocalServiceMock,
  '../models/ErrorLog': ErrorLogMock
};

// Import the controller with mocked dependencies
const localServiceController = proxyquire(../../../src/controllers/localServiceController, {
  ...modelsMock,
  'express-validator': expressValidatorMock
  // Add other dependencies as needed, for example:
  // 'multer': multerMock,
  // 'fs': fsMock,
  // etc.
});

describe('LocalService Controller Tests', function() {
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
  let mockLocalService, mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Create mock data
    mockLocalService = {
      _id: new ObjectId(),
      id: new ObjectId().toString(),
      name: 'Test LocalService',
      // Add more properties as needed for your specific model
      createdAt: new Date(),
      save: sinon.stub().resolves(true)
    };

    // Setup request object
    mockReq = {
      user: { id: new ObjectId().toString(), role: 'user' },
      body: {},
      params: { id: mockLocalService._id.toString() },
      query: {}
    };
    
    // Setup response object
    mockRes = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    
    // Setup next function
    mockNext = sinon.stub();
    
    // Reset all stubs
    sinon.restore();

    // Setup mock behaviors
    LocalServiceMock.findById = sinon.stub().resolves(mockLocalService);
    LocalServiceMock.findOne = sinon.stub().resolves(mockLocalService);
    LocalServiceMock.find = sinon.stub().returns({
      sort: sinon.stub().returnsThis(),
      skip: sinon.stub().returnsThis(),
      limit: sinon.stub().resolves([mockLocalService])
    });
    LocalServiceMock.countDocuments = sinon.stub().resolves(1);
    LocalServiceMock.create = sinon.stub().resolves(mockLocalService);
    LocalServiceMock.findByIdAndUpdate = sinon.stub().resolves(mockLocalService);
    LocalServiceMock.findByIdAndDelete = sinon.stub().resolves(mockLocalService);
    
    ErrorLogMock.create = sinon.stub().resolves({});
    
    // Reset validation result mock
    validationResultMock.isEmpty = sinon.stub().returns(true);
    validationResultMock.array = sinon.stub().returns([]);
  });

  afterEach(() => {
    // Clean up after each test
    sinon.restore();
  });

  // Test the controller's existence and functions
  describe('Controller Initialization', () => {
    it('should exist and export expected functions', () => {
      expect(localServiceController).to.be.an('object');
      // Add checks for specific methods in your controller
      expect(localServiceController.getAllLocalServices).to.be.a('function');
      expect(localServiceController.getLocalService).to.be.a('function');
      expect(localServiceController.createLocalService).to.be.a('function');
      expect(localServiceController.updateLocalService).to.be.a('function');
      expect(localServiceController.deleteLocalService).to.be.a('function');
    });
  });

  // Test method to get all resources
  describe('getAllLocalServices Function', () => {
    it('should retrieve all resources successfully', async () => {
      // Setup request with some query parameters
      mockReq.query = { page: 1, limit: 10 };
      
      // Call the controller function
      await localServiceController.getAllLocalServices(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(200)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response).to.have.property('data');
    });

    it('should handle database errors', async () => {
      // Force an error for this test
      LocalServiceMock.find = sinon.stub().throws(new Error('Database error'));
      
      // Call the controller function
      await localServiceController.getAllLocalServices(mockReq, mockRes);
      
      // Assert the error response
      expect(mockRes.status.calledWith(500)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('error');
      
      // Verify error was logged
      expect(ErrorLogMock.create.calledOnce).to.be.true;
    });
  });

  // Test method to get a single resource
  describe('getLocalService Function', () => {
    it('should retrieve resource by ID successfully', async () => {
      // Call the controller function
      await localServiceController.getLocalService(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(200)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('[modelName]');
    });

    it('should return 404 if resource not found', async () => {
      // Make findById return null
      LocalServiceMock.findById = sinon.stub().resolves(null);
      
      // Call the controller function
      await localServiceController.getLocalService(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(404)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
    });
  });

  // Test method to create a resource
  describe('createLocalService Function', () => {
    it('should create resource successfully', async () => {
      // Setup request body
      mockReq.body = {
        name: 'New LocalService',
        // Add more properties as needed
      };
      
      // Call the controller function
      await localServiceController.createLocalService(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(201)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('[modelName]');
    });

    it('should handle validation errors', async () => {
      // Force validation error
      validationResultMock.isEmpty = sinon.stub().returns(false);
      validationResultMock.array = sinon.stub().returns([
        { param: 'name', msg: 'Name is required' }
      ]);
      
      // Call the controller function
      await localServiceController.createLocalService(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(400)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
    });
  });

  // Add more test suites for other controller methods as needed
}); 