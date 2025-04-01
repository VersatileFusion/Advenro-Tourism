const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const mongoose = require('mongoose');

// Create mock models
const EventBookingMock = {
  create: sinon.stub(),
  find: sinon.stub().returns({
    populate: sinon.stub().returnsThis(),
    sort: sinon.stub().returnsThis(),
    skip: sinon.stub().returnsThis(),
    limit: sinon.stub().resolves([])
  }),
  countDocuments: sinon.stub().resolves(0),
  aggregate: sinon.stub().resolves([])
};

const EventMock = {
  findById: sinon.stub(),
  exists: sinon.stub().resolves(true),
  save: sinon.stub().resolves()
};

const ErrorLogMock = {
  create: sinon.stub().resolves()
};

// Mock validation result
const validationResultMock = {
  isEmpty: sinon.stub().returns(true),
  array: sinon.stub().returns([])
};

// Mock data
const mockUser = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Test User',
  email: 'test@example.com'
};

const mockEvent = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Test Event',
  description: 'Test Description',
  startDate: new Date(Date.now() + 86400000), // Tomorrow
  endDate: new Date(Date.now() + 172800000), // Day after tomorrow
  tickets: {
    id: sinon.stub().callsFake((ticketId) => {
      return mockEvent.tickets[0]._id.toString() === ticketId.toString() ? mockEvent.tickets[0] : null;
    }),
    0: {
      _id: new mongoose.Types.ObjectId(),
      name: 'Regular Ticket',
      price: 100,
      quantity: 100,
      maxPerPurchase: 5,
      active: true,
      reservedQuantity: 0,
      soldQuantity: 0
    },
    findIndex: sinon.stub().callsFake((callback) => {
      return callback(mockEvent.tickets[0]) ? 0 : -1;
    }),
    length: 1
  },
  active: true,
  status: 'active',
  getAvailableTickets: () => 100,
  save: sinon.stub().resolves()
};

const mockBooking = {
  _id: new mongoose.Types.ObjectId(),
  event: mockEvent._id,
  user: mockUser._id,
  tickets: [
    {
      ticket: mockEvent.tickets[0]._id,
      ticketName: 'Regular Ticket',
      price: 100,
      quantity: 2,
      subtotal: 200
    }
  ],
  totalAmount: 200,
  status: 'pending',
  paymentStatus: 'pending'
};

const mockAttendees = [
  {
    name: 'Attendee 1',
    email: 'attendee1@example.com'
  },
  {
    name: 'Attendee 2',
    email: 'attendee2@example.com'
  }
];

// Load controller with mocked dependencies
const eventBookingController = proxyquire('../../../src/controllers/eventBookingController', {
  '../models/EventBooking': EventBookingMock,
  '../models/Event': EventMock,
  '../models/ErrorLog': ErrorLogMock,
  'express-validator': { validationResult: () => validationResultMock }
});

describe('Event Booking Controller Tests', () => {
  beforeEach(() => {
    // Reset stubs
    EventBookingMock.create.resolves(mockBooking);
    EventMock.findById.resolves(mockEvent);
    EventMock.exists.resolves(true);
    EventBookingMock.find.returns({
      populate: sinon.stub().returnsThis(),
      sort: sinon.stub().returnsThis(),
      skip: sinon.stub().returnsThis(),
      limit: sinon.stub().resolves([mockBooking])
    });
    validationResultMock.isEmpty.returns(true);
    validationResultMock.array.returns([]);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createBooking', () => {
    let req, res;

    beforeEach(() => {
      req = {
        user: mockUser,
        body: {
          event: mockEvent._id,
          tickets: [
            {
              ticket: mockEvent.tickets[0]._id,
              quantity: 2
            }
          ],
          attendees: mockAttendees
        },
        originalUrl: '/api/events/bookings'
      };

      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      };
    });

    it('should create a new booking successfully', async () => {
      await eventBookingController.createBooking(req, res);

      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('booking');
      expect(EventBookingMock.create.calledOnce).to.be.true;
    });

    it('should return 400 if no tickets selected', async () => {
      req.body.tickets = [];

      await eventBookingController.createBooking(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('ticket must be selected');
    });

    it('should return 404 if event not found', async () => {
      EventMock.findById.resolves(null);

      await eventBookingController.createBooking(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('Event not found');
    });

    it('should return 400 if event is in the past', async () => {
      const pastEvent = {
        ...mockEvent,
        startDate: new Date(Date.now() - 86400000), // Yesterday
        endDate: new Date(Date.now() - 43200000) // 12 hours ago
      };
      EventMock.findById.resolves(pastEvent);

      await eventBookingController.createBooking(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('past events');
    });

    it('should handle server errors', async () => {
      EventBookingMock.create.rejects(new Error('Database error'));

      await eventBookingController.createBooking(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.status).to.equal('error');
      expect(response.message).to.include('Failed to create booking');
    });
  });

  describe('getAllBookings', () => {
    let req, res;

    beforeEach(() => {
      req = {
        params: {
          eventId: mockEvent._id.toString()
        },
        query: {},
        originalUrl: '/api/events/bookings'
      };

      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      };
    });

    it('should get all bookings for an event', async () => {
      await eventBookingController.getAllBookings(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('bookings');
    });

    it('should return 404 if event does not exist', async () => {
      EventMock.exists.resolves(false);

      await eventBookingController.getAllBookings(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('Event not found');
    });

    it('should apply filters when provided', async () => {
      req.query.status = 'confirmed';
      req.query.paymentStatus = 'paid';

      await eventBookingController.getAllBookings(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('bookings');
    });

    it('should handle server errors', async () => {
      EventBookingMock.find.returns({
        populate: sinon.stub().rejects(new Error('Database error'))
      });

      await eventBookingController.getAllBookings(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.status).to.equal('error');
      expect(response.message).to.include('Failed to retrieve bookings');
    });
  });

  describe('getMyBookings', () => {
    let req, res;

    beforeEach(() => {
      req = {
        user: mockUser,
        query: {},
        originalUrl: '/api/events/my-bookings'
      };

      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      };

      // Reset stubs
      EventBookingMock.aggregate.resolves([mockBooking]);
      EventBookingMock.find.returns({
        populate: sinon.stub().returnsThis(),
        sort: sinon.stub().returnsThis(),
        skip: sinon.stub().returnsThis(),
        limit: sinon.stub().resolves([mockBooking])
      });
    });

    it('should get current user bookings', async () => {
      await eventBookingController.getMyBookings(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('bookings');
    });

    it('should apply upcoming filter when requested', async () => {
      req.query.upcoming = 'true';

      await eventBookingController.getMyBookings(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('bookings');
      expect(EventBookingMock.aggregate.calledOnce).to.be.true;
    });

    it('should handle server errors', async () => {
      EventBookingMock.find.returns({
        populate: sinon.stub().rejects(new Error('Database error'))
      });

      await eventBookingController.getMyBookings(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.status).to.equal('error');
      expect(response.message).to.equal('Failed to retrieve your bookings');
    });
  });
});