const chai = require('chai');
const expect = chai.expect;
const mongoose = require('mongoose');
const proxyquire = require('proxyquire');

// Import test setup
const { dbHelper } = require('../../config/setup');

describe('Basic Controller Tests', function() {
  // Setup hooks
  before(async function() {
    // Connect to test database if not already connected
    if (mongoose.connection.readyState !== 1) {
      await dbHelper.connect();
    }
  });

  after(async function() {
    console.log('Disconnected from test database');
  });

  // Test UserController exists and exports expected functions
  describe('UserController', () => {
    // Safely load controller with proxyquire to avoid database connection issues
    const userController = proxyquire('../../../src/controllers/userController', {
      '../models': {
        User: {
          findById: () => ({
            select: () => Promise.resolve({}),
          }),
        },
      },
    });

    it('should exist and export expected functions', () => {
      expect(userController).to.be.an('object');
      expect(userController.getProfile).to.be.a('function');
      expect(userController.updateProfile).to.be.a('function');
      expect(userController.register).to.be.a('function');
      expect(userController.login).to.be.a('function');
    });
  });

  // Test AuthController exists and exports expected functions
  describe('AuthController', () => {
    // Safely load controller with proxyquire to avoid database connection issues
    const authController = proxyquire('../../../src/controllers/authController', {
      '../models': {
        User: {
          findById: () => Promise.resolve({}),
        },
      },
    });

    it('should exist and export expected functions', () => {
      expect(authController).to.be.an('object');
      expect(authController.register).to.be.a('function');
      expect(authController.login).to.be.a('function');
      expect(authController.getMe).to.be.a('function');
      expect(authController.protect).to.be.a('function');
      expect(authController.restrictTo).to.be.a('function');
    });
  });

  // Test BookingController exists and exports expected functions
  describe('BookingController', () => {
    // Safely load controller with proxyquire to avoid database connection issues
    const bookingController = proxyquire('../../../src/controllers/bookingController', {
      '../models': {
        Booking: {
          find: () => Promise.resolve([]),
        },
        Hotel: {},
        Tour: {},
        Flight: {},
      },
    });

    it('should exist and export expected functions', () => {
      expect(bookingController).to.be.an('object');
      expect(bookingController.getBookings).to.be.a('function');
      expect(bookingController.getBooking).to.be.a('function');
      expect(bookingController.createBooking).to.be.a('function');
      if (bookingController.updateBooking) {
        expect(bookingController.updateBooking).to.be.a('function');
      }
      if (bookingController.deleteBooking) {
        expect(bookingController.deleteBooking).to.be.a('function');
      }
    });
  });
}); 