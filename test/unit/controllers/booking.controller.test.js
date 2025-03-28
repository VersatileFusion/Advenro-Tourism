const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Import the controller
const bookingController = require('../../../src/controllers/bookingController');

// Import models
const { Booking, Hotel, Flight, Tour } = require('../../../src/models');

// Load test setup
require('../../config/setup');

describe('Booking Controller Tests', function() {
  this.timeout(10000);

  // Test data 
  let mockUser;
  let mockAdmin;
  let mockBooking;
  let mockHotel;
  let mockFlight;
  let mockTour;
  let req, res;

  beforeEach(() => {
    // Create mock data
    mockUser = {
      _id: new ObjectId(),
      id: new ObjectId().toString(),
      name: 'Test User',
      email: 'test@example.com',
      role: 'user'
    };

    mockAdmin = {
      _id: new ObjectId(),
      id: new ObjectId().toString(),
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin'
    };

    mockHotel = {
      _id: new ObjectId(),
      name: 'Test Hotel',
      price: 150,
      rooms: [
        { id: 'room1', type: 'standard', available: true },
        { id: 'room2', type: 'deluxe', available: true }
      ]
    };

    mockFlight = {
      _id: new ObjectId(),
      name: 'Test Flight',
      price: 300,
      seats: {
        total: 100,
        available: 50
      }
    };

    mockTour = {
      _id: new ObjectId(),
      name: 'Test Tour',
      price: 250
    };

    mockBooking = {
      _id: new ObjectId(),
      user: mockUser._id,
      bookingType: 'Hotel',
      itemId: mockHotel._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'confirmed',
      paymentStatus: 'paid',
      amount: 300,
      createdAt: new Date()
    };

    // Setup request and response objects
    req = {
      user: mockUser,
      params: {
        id: mockBooking._id.toString()
      },
      query: {},
      body: {}
    };
    
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };

    // Stubs for Booking model methods
    sinon.stub(Booking, 'find').returns({
      sort: sinon.stub().returnsThis(),
      skip: sinon.stub().returnsThis(),
      limit: sinon.stub().returnsThis(),
      populate: sinon.stub().returnsThis()
    });
    sinon.stub(Booking, 'findById').returns({
      populate: sinon.stub().returnsThis()
    });
    sinon.stub(Booking, 'countDocuments').resolves(10);
    sinon.stub(Booking, 'create').resolves(mockBooking);
    sinon.stub(Booking, 'findByIdAndUpdate').resolves(mockBooking);
    sinon.stub(Booking, 'findByIdAndDelete').resolves(mockBooking);
    
    // Stubs for Hotel model methods
    sinon.stub(Hotel, 'findById').resolves(mockHotel);
    sinon.stub(Hotel, 'findByIdAndUpdate').resolves(mockHotel);
    
    // Stubs for Flight model methods
    sinon.stub(Flight, 'findById').resolves(mockFlight);
    sinon.stub(Flight, 'findByIdAndUpdate').resolves(mockFlight);
    
    // Stubs for Tour model methods
    sinon.stub(Tour, 'findById').resolves(mockTour);
  });

  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });

  describe('getBookings', () => {
    beforeEach(() => {
      // Set up specific stubs for this test case
      Booking.find().populate.resolves([mockBooking]);
    });

    it('should get all bookings for admin user', async () => {
      req.user = mockAdmin;
      
      await bookingController.getBookings(req, res);

      expect(Booking.find.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.success).to.be.true;
      expect(response.data).to.be.an('array');
    });

    it('should get only user bookings for regular user', async () => {
      await bookingController.getBookings(req, res);

      expect(Booking.find.calledOnce).to.be.true;
      expect(Booking.find.args[0][0]).to.deep.equal({ user: mockUser.id });
      expect(res.status.calledWith(200)).to.be.true;
    });

    it('should apply filters when provided', async () => {
      req.query = {
        type: 'Hotel',
        status: 'confirmed',
        paymentStatus: 'paid',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        sort: 'createdAt',
        page: 2,
        limit: 5
      };

      await bookingController.getBookings(req, res);

      expect(Booking.find.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.pagination.page).to.equal(2);
      expect(response.pagination.limit).to.equal(5);
    });

    it('should handle server errors', async () => {
      // Make Booking.find throw an error
      Booking.find.throws(new Error('Database error'));

      await bookingController.getBookings(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.success).to.be.false;
    });
  });

  describe('getBooking', () => {
    beforeEach(() => {
      // Set up Booking.findById().populate to return mockBooking
      mockBooking.user = {
        _id: mockUser._id
      };
      Booking.findById().populate.resolves(mockBooking);
    });

    it('should get a booking by ID for the owner', async () => {
      await bookingController.getBooking(req, res);

      expect(Booking.findById.calledWith(mockBooking._id.toString())).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.success).to.be.true;
      expect(response.data).to.deep.equal(mockBooking);
    });

    it('should get a booking by ID for admin', async () => {
      req.user = mockAdmin;
      mockBooking.user._id = mockUser._id; // Different user's booking

      await bookingController.getBooking(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.success).to.be.true;
    });

    it('should return 404 if booking not found', async () => {
      Booking.findById().populate.resolves(null);

      await bookingController.getBooking(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.success).to.be.false;
      expect(response.error).to.include('not found');
    });

    it('should return 401 if user is not booking owner or admin', async () => {
      // Change the user ID to be different
      mockBooking.user._id = new ObjectId();

      await bookingController.getBooking(req, res);

      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.success).to.be.false;
      expect(response.error).to.include('Not authorized');
    });

    it('should handle server errors', async () => {
      Booking.findById().populate.throws(new Error('Database error'));

      await bookingController.getBooking(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.success).to.be.false;
    });
  });

  describe('createBooking', () => {
    beforeEach(() => {
      req.body = {
        bookingType: 'Hotel',
        itemId: mockHotel._id.toString(),
        startDate: '2023-07-01',
        endDate: '2023-07-08',
        guests: 2,
        specialRequests: 'Late check-in'
      };
    });

    it('should create a hotel booking successfully', async () => {
      await bookingController.createBooking(req, res);

      expect(Hotel.findById.calledWith(mockHotel._id.toString())).to.be.true;
      expect(Booking.create.calledOnce).to.be.true;
      expect(Hotel.findByIdAndUpdate.calledOnce).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.success).to.be.true;
      expect(response.data).to.deep.equal(mockBooking);
    });

    it('should create a flight booking successfully', async () => {
      req.body.bookingType = 'Flight';
      req.body.itemId = mockFlight._id.toString();

      await bookingController.createBooking(req, res);

      expect(Flight.findById.calledWith(mockFlight._id.toString())).to.be.true;
      expect(Booking.create.calledOnce).to.be.true;
      expect(Flight.findByIdAndUpdate.calledOnce).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
    });

    it('should create a tour booking successfully', async () => {
      req.body.bookingType = 'Tour';
      req.body.itemId = mockTour._id.toString();

      await bookingController.createBooking(req, res);

      expect(Tour.findById.calledWith(mockTour._id.toString())).to.be.true;
      expect(Booking.create.calledOnce).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
    });

    it('should return 404 if hotel not found', async () => {
      Hotel.findById.resolves(null);

      await bookingController.createBooking(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.success).to.be.false;
      expect(response.error).to.include('not found');
    });

    it('should return 400 if no rooms available', async () => {
      // Make all rooms unavailable
      mockHotel.rooms.forEach(room => room.available = false);
      Hotel.findById.resolves(mockHotel);

      await bookingController.createBooking(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.success).to.be.false;
      expect(response.error).to.include('No rooms available');
    });

    it('should return 400 if no flight seats available', async () => {
      req.body.bookingType = 'Flight';
      req.body.itemId = mockFlight._id.toString();
      
      // Make flight full
      mockFlight.seats.available = 0;
      Flight.findById.resolves(mockFlight);

      await bookingController.createBooking(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.success).to.be.false;
      expect(response.error).to.include('No seats available');
    });

    it('should return 400 for invalid booking type', async () => {
      req.body.bookingType = 'InvalidType';

      await bookingController.createBooking(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.success).to.be.false;
      expect(response.error).to.include('Invalid booking type');
    });

    it('should handle server errors', async () => {
      Booking.create.throws(new Error('Database error'));

      await bookingController.createBooking(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.success).to.be.false;
    });
  });

  describe('updateBookingStatus', () => {
    beforeEach(() => {
      req.body = {
        status: 'cancelled'
      };
      
      // Restore the default behavior and set up for this specific test
      Booking.findById.restore();
      sinon.stub(Booking, 'findById').resolves(mockBooking);
    });

    it('should update booking status successfully', async () => {
      await bookingController.updateBookingStatus(req, res);

      expect(Booking.findById.calledWith(mockBooking._id.toString())).to.be.true;
      expect(Booking.findByIdAndUpdate.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.success).to.be.true;
      expect(response.data).to.deep.equal(mockBooking);
    });

    it('should return 404 if booking not found', async () => {
      Booking.findById.resolves(null);

      await bookingController.updateBookingStatus(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.success).to.be.false;
      expect(response.error).to.include('not found');
    });

    it('should return 401 if user is not booking owner or admin', async () => {
      // Change the booking user to be different
      mockBooking.user = new ObjectId();
      Booking.findById.resolves(mockBooking);

      await bookingController.updateBookingStatus(req, res);

      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.success).to.be.false;
      expect(response.error).to.include('Not authorized');
    });

    it('should return 400 for invalid status', async () => {
      req.body.status = 'invalidstatus';

      await bookingController.updateBookingStatus(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.success).to.be.false;
      expect(response.error).to.include('Invalid status');
    });

    it('should handle server errors', async () => {
      Booking.findById.throws(new Error('Database error'));

      await bookingController.updateBookingStatus(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.success).to.be.false;
    });
  });

  describe('deleteBooking', () => {
    beforeEach(() => {
      // Restore the default behavior and set up for this specific test
      Booking.findById.restore();
      sinon.stub(Booking, 'findById').resolves(mockBooking);
    });

    it('should delete booking successfully for admin', async () => {
      req.user = mockAdmin;

      await bookingController.deleteBooking(req, res);

      expect(Booking.findById.calledWith(mockBooking._id.toString())).to.be.true;
      expect(Booking.findByIdAndDelete.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.success).to.be.true;
    });

    it('should return 404 if booking not found', async () => {
      Booking.findById.resolves(null);

      await bookingController.deleteBooking(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.success).to.be.false;
      expect(response.error).to.include('not found');
    });

    it('should return 401 if user is not admin', async () => {
      // User is already not admin in default setup

      await bookingController.deleteBooking(req, res);

      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.success).to.be.false;
      expect(response.error).to.include('Not authorized');
    });

    it('should handle server errors', async () => {
      req.user = mockAdmin;
      Booking.findById.throws(new Error('Database error'));

      await bookingController.deleteBooking(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.success).to.be.false;
    });
  });
}); 