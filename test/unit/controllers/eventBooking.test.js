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
 * - EventBooking - capitalized model name (e.g., User, Booking)
 * - ../../../src/controllers/eventBookingController - path to the controller (e.g., ../../../src/controllers/userController)
 * - eventBookingController - name of the controller variable (e.g., userController)
 * - getAllEventBookings - name of the method to get all resources (e.g., getAllUsers)
 * - getEventBooking - name of the method to get a single resource (e.g., getUser)
 * - createEventBooking - name of the method to create a resource (e.g., createUser)
 * - updateEventBooking - name of the method to update a resource (e.g., updateUser)
 * - deleteEventBooking - name of the method to delete a resource (e.g., deleteUser)
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
const EventBookingMock = {
  findById: sinon.stub(),
  findOne: sinon.stub(),
  find: sinon.stub(),
  create: sinon.stub(),
  findByIdAndUpdate: sinon.stub(),
  findByIdAndDelete: sinon.stub(),
  countDocuments: sinon.stub(),
  aggregate: sinon.stub(),
  exists: sinon.stub()
};

const EventMock = {
  findById: sinon.stub(),
  exists: sinon.stub(),
  save: sinon.stub(),
  findByIdAndUpdate: sinon.stub()
};

const UserMock = {
  findById: sinon.stub()
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

// Mock sendEmail utility
const sendEmailMock = sinon.stub().resolves();

// Mock crypto
const cryptoMock = {
  randomBytes: sinon.stub().returns({
    toString: sinon.stub().returns('abc123')
  })
};

// Import the controller with mocked dependencies
const modelsMock = {
  '../models/EventBooking': EventBookingMock,
  '../models/Event': EventMock,
  '../models/User': UserMock,
  '../models/ErrorLog': ErrorLogMock
};

// Import the controller with mocked dependencies
const eventBookingController = proxyquire('../../../src/controllers/eventBookingController', {
  ...modelsMock,
  'express-validator': expressValidatorMock,
  '../utils/email': sendEmailMock,
  'crypto': cryptoMock
});

describe('EventBooking Controller Tests', function() {
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
  let mockEventBooking, mockEvent, mockUser, mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Create mock event data
    mockEvent = {
      _id: new ObjectId(),
      name: 'Test Event',
      description: 'A test event',
      startDate: new Date(Date.now() + 86400000), // Tomorrow
      endDate: new Date(Date.now() + 172800000),  // Day after tomorrow
      location: {
        address: '123 Test St',
        city: 'Test City',
        country: 'Test Country'
      },
      tickets: [
        {
          _id: new ObjectId(),
          name: 'General Admission',
          description: 'General admission ticket',
          price: 25.00,
          quantity: 100,
          soldQuantity: 0,
          reservedQuantity: 0,
          maxPerPurchase: 4,
          active: true,
          id: function() { return this._id; }
        }
      ],
      status: 'active',
      active: true,
      getAvailableTickets: sinon.stub().returns(100),
      save: sinon.stub().resolves(true)
    };
    
    // Add ID function to tickets array
    mockEvent.tickets.id = function(id) {
      return this.find(ticket => ticket._id.toString() === id.toString());
    };
    
    // Create mock user data
    mockUser = {
      _id: new ObjectId(),
      name: 'Test User',
      email: 'test@example.com',
      phone: '123-456-7890',
      role: 'user'
    };
    
    // Create mock booking data
    mockEventBooking = {
      _id: new ObjectId(),
      event: mockEvent._id,
      user: mockUser._id,
      bookingDate: new Date(),
      tickets: [
        {
          ticket: mockEvent.tickets[0]._id,
          ticketName: 'General Admission',
          price: 25.00,
          quantity: 2,
          subtotal: 50.00
        }
      ],
      attendees: [
        {
          name: 'John Doe',
          email: 'john@example.com'
        },
        {
          name: 'Jane Doe',
          email: 'jane@example.com'
        }
      ],
      totalAmount: 50.00,
      paymentStatus: 'pending',
      status: 'pending',
      confirmationCode: 'TEST1234',
      save: sinon.stub().resolves(true)
    };

    // Setup request object
    mockReq = {
      user: mockUser,
      body: {},
      params: { id: mockEventBooking._id.toString() },
      query: {},
      originalUrl: '/api/bookings/events'
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
    EventBookingMock.findById = sinon.stub().resolves(mockEventBooking);
    EventBookingMock.findOne = sinon.stub().resolves(mockEventBooking);
    EventBookingMock.find = sinon.stub().returns({
      populate: sinon.stub().returnsThis(),
      sort: sinon.stub().returnsThis(),
      skip: sinon.stub().returnsThis(),
      limit: sinon.stub().resolves([mockEventBooking])
    });
    EventBookingMock.countDocuments = sinon.stub().resolves(1);
    EventBookingMock.create = sinon.stub().resolves(mockEventBooking);
    EventBookingMock.aggregate = sinon.stub().resolves([mockEventBooking]);
    
    EventMock.findById = sinon.stub().resolves(mockEvent);
    EventMock.exists = sinon.stub().resolves(true);
    
    UserMock.findById = sinon.stub().resolves(mockUser);
    
    ErrorLogMock.create = sinon.stub().resolves({});
    
    // Reset validation result mock
    validationResultMock.isEmpty = sinon.stub().returns(true);
    validationResultMock.array = sinon.stub().returns([]);
    
    // Reset sendEmail mock
    sendEmailMock.reset();
    sendEmailMock.resolves();
  });

  afterEach(() => {
    // Clean up after each test
    sinon.restore();
  });

  // Test the controller's existence and functions
  describe('Controller Initialization', () => {
    it('should exist and export expected functions', () => {
      expect(eventBookingController).to.be.an('object');
      expect(eventBookingController.createBooking).to.be.a('function');
      expect(eventBookingController.getAllBookings).to.be.a('function');
      expect(eventBookingController.getMyBookings).to.be.a('function');
      expect(eventBookingController.getBooking).to.be.a('function');
      expect(eventBookingController.updateBookingStatus).to.be.a('function');
    });
  });

  // Test createBooking function
  describe('createBooking Function', () => {
    it('should create booking successfully', async () => {
      // Setup request body with valid booking data
      mockReq.body = {
        event: mockEvent._id.toString(),
        tickets: [
          {
            ticket: mockEvent.tickets[0]._id.toString(),
            quantity: 2
          }
        ],
        attendees: [
          {
            name: 'John Doe',
            email: 'john@example.com'
          },
          {
            name: 'Jane Doe',
            email: 'jane@example.com'
          }
        ]
      };
      
      // Call the controller function
      await eventBookingController.createBooking(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(201)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('booking');
      
      // Verify event was saved (to update ticket quantities)
      expect(mockEvent.save.calledOnce).to.be.true;
    });

    it('should handle validation errors', async () => {
      // Force validation error
      validationResultMock.isEmpty = sinon.stub().returns(false);
      validationResultMock.array = sinon.stub().returns([
        { param: 'tickets', msg: 'Tickets are required' }
      ]);
      
      // Call the controller function
      await eventBookingController.createBooking(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(400)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the error message
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('Validation failed');
    });
  });

  // Test getBooking function
  describe('getBooking Function', () => {
    it('should retrieve booking by ID successfully', async () => {
      // Setup findById with proper populate chaining
      const populateChain = {
        populate: sinon.stub().returns({
          populate: sinon.stub().resolves(mockEventBooking)
        })
      };
      
      EventBookingMock.findById = sinon.stub().returns(populateChain);
      
      // Add user details to mockEventBooking for this test
      mockEventBooking.user = mockUser;
      
      // Call the controller function
      await eventBookingController.getBooking(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(200)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('booking');
    });

    it('should return 404 if booking not found', async () => {
      // Make findById return null with proper populate chaining
      const populateChain = {
        populate: sinon.stub().returns({
          populate: sinon.stub().resolves(null)
        })
      };
      
      EventBookingMock.findById = sinon.stub().returns(populateChain);
      
      // Call the controller function
      await eventBookingController.getBooking(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(404)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the error message
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('not found');
    });
  });
}); 