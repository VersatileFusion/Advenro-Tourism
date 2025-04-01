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
 * - Flight - capitalized model name (e.g., User, Booking)
 * - ../../../src/controllers/flightController - path to the controller (e.g., ../../../src/controllers/userController)
 * - flightController - name of the controller variable (e.g., userController)
 * - getAllFlights - name of the method to get all resources (e.g., getAllUsers)
 * - getFlight - name of the method to get a single resource (e.g., getUser)
 * - createFlight - name of the method to create a resource (e.g., createUser)
 * - updateFlight - name of the method to update a resource (e.g., updateUser)
 * - deleteFlight - name of the method to delete a resource (e.g., deleteUser)
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
const FlightMock = {
  findById: sinon.stub().resolves({
    _id: new ObjectId(),
    flightNumber: 'AB123',
    airline: 'Test Airline',
    departureCity: 'New York',
    arrivalCity: 'London',
    departureDate: new Date(),
    price: 500,
    save: sinon.stub().resolves(true)
  }),
  find: sinon.stub().returns({
    sort: sinon.stub().returnsThis(),
    skip: sinon.stub().returnsThis(),
    limit: sinon.stub().resolves([])
  }),
  create: sinon.stub(),
  findByIdAndUpdate: sinon.stub(),
  findByIdAndDelete: sinon.stub(),
  countDocuments: sinon.stub()
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
  '../models': { Flight: FlightMock },
  '../middleware/async': asyncHandlerMock,
  'express-validator': expressValidatorMock
};

// Import the controller with mocked dependencies
const flightController = proxyquire('../../../src/controllers/flightController', mockDependencies);

describe('Flight Controller Tests', function() {
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
      expect(flightController).to.be.an('object');
      expect(flightController.getFlights).to.be.a('function');
      expect(flightController.getFlight).to.be.a('function');
      expect(flightController.createFlight).to.be.a('function');
      expect(flightController.updateFlight).to.be.a('function');
      expect(flightController.deleteFlight).to.be.a('function');
      expect(flightController.searchFlights).to.be.a('function');
    });
  });
}); 