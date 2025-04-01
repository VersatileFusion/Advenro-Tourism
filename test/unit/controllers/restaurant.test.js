/**
 * Template file for controller tests using proxyquire
 * 
 * How to use this template:
 * 1. Copy this file to test/unit/controllers/restaurantController.test.js
 * 2. Replace placeholders with actual values
 * 3. Implement test cases for your controller functions
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
const RestaurantMock = {
  findById: sinon.stub(),
  findOne: sinon.stub(),
  find: sinon.stub(),
  create: sinon.stub(),
  findByIdAndUpdate: sinon.stub(),
  findByIdAndDelete: sinon.stub(),
  countDocuments: sinon.stub(),
  aggregate: sinon.stub(),
  getRestaurantsNearby: sinon.stub()
};

const ErrorLogMock = {
  create: sinon.stub()
};

// Mock the multer middleware
const multerMock = {
  diskStorage: () => ({}),
  single: () => (req, res, next) => next(),
  array: () => (req, res, next) => next(),
  fields: () => (req, res, next) => next()
};

// Mock the express-validator
const validationResultMock = {
  isEmpty: sinon.stub().returns(true),
  array: sinon.stub().returns([])
};

const expresValidatorMock = {
  validationResult: () => validationResultMock
};

// Mock the fs and path modules
const fsMock = {
  existsSync: sinon.stub().returns(true),
  mkdirSync: sinon.stub(),
  unlinkSync: sinon.stub()
};

const pathMock = {
  join: sinon.stub().returns('/mock/path')
};

// Mock the models module with direct imports
const modelsMock = {
  '../models/Restaurant': RestaurantMock,
  '../models/ErrorLog': ErrorLogMock
};

// Import the controller with mocked dependencies
const restaurantController = proxyquire('../../../src/controllers/restaurantController', {
  ...modelsMock,
  'express-validator': expresValidatorMock,
  'multer': multerMock,
  'fs': fsMock,
  'path': pathMock
});

describe('Restaurant Controller Tests', function() {
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
  let mockRestaurant, mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Create mock restaurant data
    mockRestaurant = {
      _id: new ObjectId(),
      id: new ObjectId().toString(),
      name: 'Test Restaurant',
      description: 'A test restaurant',
      cuisineType: ['Italian', 'Pizza'],
      priceLevel: 2,
      location: {
        type: 'Point',
        coordinates: [40.7128, -74.0060],
        address: '123 Test St',
        city: 'Test City',
        country: 'Test Country'
      },
      features: {
        delivery: true,
        takeout: true,
        reservations: true,
        outdoor: false
      },
      openingHours: {
        monday: { open: '09:00', close: '22:00' }
      },
      averageRating: 4.5,
      reviewCount: 10,
      coverImage: 'cover.jpg',
      images: ['image1.jpg', 'image2.jpg'],
      menu: [],
      active: true,
      createdAt: new Date(),
      save: sinon.stub().resolves(true)
    };

    // Setup request object
    mockReq = {
      user: { id: new ObjectId().toString(), role: 'admin' },
      body: {},
      params: { id: mockRestaurant._id.toString() },
      query: {},
      originalUrl: '/api/restaurants',
      files: {
        coverImage: [{ filename: 'cover.jpg' }],
        images: [{ filename: 'image1.jpg' }, { filename: 'image2.jpg' }]
      }
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

    // Reset mock behaviors - safer approach without requiring reset method
    RestaurantMock.findById = sinon.stub().resolves(mockRestaurant);
    RestaurantMock.findOne = sinon.stub();
    RestaurantMock.find = sinon.stub().returns({
      sort: sinon.stub().returnsThis(),
      skip: sinon.stub().returnsThis(),
      limit: sinon.stub().resolves([mockRestaurant])
    });
    RestaurantMock.countDocuments = sinon.stub().resolves(1);
    RestaurantMock.create = sinon.stub().resolves(mockRestaurant);
    RestaurantMock.findByIdAndUpdate = sinon.stub().resolves(mockRestaurant);
    RestaurantMock.findByIdAndDelete = sinon.stub().resolves(mockRestaurant);
    RestaurantMock.getRestaurantsNearby = sinon.stub().resolves([mockRestaurant]);
    RestaurantMock.aggregate = sinon.stub();
    
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
      expect(restaurantController).to.be.an('object');
      expect(restaurantController.getAllRestaurants).to.be.a('function');
      expect(restaurantController.getRestaurant).to.be.a('function');
      expect(restaurantController.createRestaurant).to.be.a('function');
      expect(restaurantController.updateRestaurant).to.be.a('function');
      expect(restaurantController.deleteRestaurant).to.be.a('function');
    });
  });

  // Test getAllRestaurants function
  describe('getAllRestaurants Function', () => {
    it('should retrieve all restaurants successfully', async () => {
      // Setup request with some query parameters
      mockReq.query = { page: 1, limit: 10 };
      
      // Call the controller function
      await restaurantController.getAllRestaurants(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(200)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response).to.have.property('data');
      expect(response).to.have.property('pagination');
      expect(response).to.have.property('results');
    });

    it('should handle location-based search', async () => {
      // Setup request with near parameter
      mockReq.query = { near: '40.7128,-74.0060', distance: '10' };
      
      // Call the controller function
      await restaurantController.getAllRestaurants(mockReq, mockRes);
      
      // Assert response
      expect(mockRes.status.calledWith(200)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Verify getRestaurantsNearby was called
      expect(RestaurantMock.getRestaurantsNearby.called).to.be.true;
    });

    it('should handle database errors', async () => {
      // Force an error for this test
      RestaurantMock.find = sinon.stub().throws(new Error('Database error'));
      
      // Call the controller function
      await restaurantController.getAllRestaurants(mockReq, mockRes);
      
      // Assert the error response
      expect(mockRes.status.calledWith(500)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('error');
      
      // Verify error was logged
      expect(ErrorLogMock.create.calledOnce).to.be.true;
    });
  });

  // Test getRestaurant function
  describe('getRestaurant Function', () => {
    it('should retrieve restaurant by ID successfully', async () => {
      // Call the controller function
      await restaurantController.getRestaurant(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(200)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('restaurant');
      expect(response.data.restaurant).to.deep.equal(mockRestaurant);
    });

    it('should return 404 if restaurant not found', async () => {
      // Make findById return null
      RestaurantMock.findById = sinon.stub().resolves(null);
      
      // Call the controller function
      await restaurantController.getRestaurant(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(404)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('not found');
    });
  });

  // Test createRestaurant function
  describe('createRestaurant Function', () => {
    it('should create restaurant successfully', async () => {
      // Setup request body
      mockReq.body = {
        name: 'New Restaurant',
        description: 'A brand new restaurant',
        cuisineType: 'Italian,Pizza',
        priceLevel: 2,
        latitude: 40.7128,
        longitude: -74.0060
      };
      
      // Call the controller function
      await restaurantController.createRestaurant(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(201)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('restaurant');
    });

    it('should handle validation errors', async () => {
      // Force validation error
      validationResultMock.isEmpty = sinon.stub().returns(false);
      
      // Call the controller function
      await restaurantController.createRestaurant(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(400)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
    });
  });
}); 