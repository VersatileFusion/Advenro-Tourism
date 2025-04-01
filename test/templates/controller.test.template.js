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
 * - [ModelName] - capitalized model name (e.g., User, Booking)
 * - [controllerPath] - path to the controller (e.g., ../../../src/controllers/userController)
 * - [controllerName] - name of the controller variable (e.g., userController)
 * - [getAll] - name of the method to get all resources (e.g., getAllUsers)
 * - [getOne] - name of the method to get a single resource (e.g., getUser)
 * - [create] - name of the method to create a resource (e.g., createUser)
 * - [update] - name of the method to update a resource (e.g., updateUser)
 * - [delete] - name of the method to delete a resource (e.g., deleteUser)
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
const [ModelName]Mock = {
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
  '../models/[ModelName]': [ModelName]Mock,
  '../models/ErrorLog': ErrorLogMock
};

// Import the controller with mocked dependencies
const [controllerName] = proxyquire([controllerPath], {
  ...modelsMock,
  'express-validator': expressValidatorMock
  // Add other dependencies as needed, for example:
  // 'multer': multerMock,
  // 'fs': fsMock,
  // etc.
});

describe('[ModelName] Controller Tests', function() {
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
  let mock[ModelName], mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Create mock data
    mock[ModelName] = {
      _id: new ObjectId(),
      id: new ObjectId().toString(),
      name: 'Test [ModelName]',
      // Add more properties as needed for your specific model
      createdAt: new Date(),
      save: sinon.stub().resolves(true)
    };

    // Setup request object
    mockReq = {
      user: { id: new ObjectId().toString(), role: 'user' },
      body: {},
      params: { id: mock[ModelName]._id.toString() },
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
    [ModelName]Mock.findById = sinon.stub().resolves(mock[ModelName]);
    [ModelName]Mock.findOne = sinon.stub().resolves(mock[ModelName]);
    [ModelName]Mock.find = sinon.stub().returns({
      sort: sinon.stub().returnsThis(),
      skip: sinon.stub().returnsThis(),
      limit: sinon.stub().resolves([mock[ModelName]])
    });
    [ModelName]Mock.countDocuments = sinon.stub().resolves(1);
    [ModelName]Mock.create = sinon.stub().resolves(mock[ModelName]);
    [ModelName]Mock.findByIdAndUpdate = sinon.stub().resolves(mock[ModelName]);
    [ModelName]Mock.findByIdAndDelete = sinon.stub().resolves(mock[ModelName]);
    
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
      expect([controllerName]).to.be.an('object');
      // Add checks for specific methods in your controller
      expect([controllerName].[getAll]).to.be.a('function');
      expect([controllerName].[getOne]).to.be.a('function');
      expect([controllerName].[create]).to.be.a('function');
      expect([controllerName].[update]).to.be.a('function');
      expect([controllerName].[delete]).to.be.a('function');
    });
  });

  // Test method to get all resources
  describe('[getAll] Function', () => {
    it('should retrieve all resources successfully', async () => {
      // Setup request with some query parameters
      mockReq.query = { page: 1, limit: 10 };
      
      // Call the controller function
      await [controllerName].[getAll](mockReq, mockRes);
      
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
      [ModelName]Mock.find = sinon.stub().throws(new Error('Database error'));
      
      // Call the controller function
      await [controllerName].[getAll](mockReq, mockRes);
      
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
  describe('[getOne] Function', () => {
    it('should retrieve resource by ID successfully', async () => {
      // Call the controller function
      await [controllerName].[getOne](mockReq, mockRes);
      
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
      [ModelName]Mock.findById = sinon.stub().resolves(null);
      
      // Call the controller function
      await [controllerName].[getOne](mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(404)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
    });
  });

  // Test method to create a resource
  describe('[create] Function', () => {
    it('should create resource successfully', async () => {
      // Setup request body
      mockReq.body = {
        name: 'New [ModelName]',
        // Add more properties as needed
      };
      
      // Call the controller function
      await [controllerName].[create](mockReq, mockRes);
      
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
      await [controllerName].[create](mockReq, mockRes);
      
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