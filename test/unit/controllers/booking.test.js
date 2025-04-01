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
 * - Booking - capitalized model name (e.g., User, Booking)
 * - ../../../src/controllers/bookingController - path to the controller (e.g., ../../../src/controllers/userController)
 * - bookingController - name of the controller variable (e.g., userController)
 * - getAllBookings - name of the method to get all resources (e.g., getAllUsers)
 * - getBooking - name of the method to get a single resource (e.g., getUser)
 * - createBooking - name of the method to create a resource (e.g., createUser)
 * - updateBooking - name of the method to update a resource (e.g., updateUser)
 * - deleteBooking - name of the method to delete a resource (e.g., deleteUser)
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
const BookingMock = {
  findById: sinon.stub().resolves({
    _id: new ObjectId(),
    user: new ObjectId(),
    tour: new ObjectId(),
    price: 100,
    paid: false,
    createdAt: new Date(),
    save: sinon.stub().resolves(true)
  }),
  find: sinon.stub().returns({
    sort: sinon.stub().returnsThis(),
    skip: sinon.stub().returnsThis(),
    limit: sinon.stub().resolves([])
  }),
  create: sinon.stub()
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
  '../models/Booking': BookingMock,
  '../middleware/async': asyncHandlerMock,
  'express-validator': expressValidatorMock
};

// Import the controller with mocked dependencies
const bookingController = proxyquire('../../../src/controllers/bookingController', mockDependencies);

describe('Booking Controller Tests', function() {
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
      expect(bookingController).to.be.an('object');
      expect(bookingController.createBooking).to.be.a('function');
      expect(bookingController.getBooking).to.be.a('function');
      expect(bookingController.getBookings).to.be.a('function');
      expect(bookingController.updateBooking).to.be.a('function');
      expect(bookingController.cancelBooking).to.be.a('function');
    });
  });
}); 