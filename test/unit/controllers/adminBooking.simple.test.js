const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');

describe('Admin Booking Controller Tests', function() {
  let req, res, next;
  
  beforeEach(() => {
    // Mock request object
    req = {
      params: {},
      query: {},
      body: {},
      user: { userId: 'admin123', role: 'admin' }
    };
    
    // Mock response object
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };
    
    // Mock next function
    next = sinon.spy();
  });
  
  // Mock Booking model
  const Booking = {
    find: sinon.stub(),
    findById: sinon.stub(),
    findByIdAndUpdate: sinon.stub(),
    findByIdAndDelete: sinon.stub(),
    countDocuments: sinon.stub(),
    aggregate: sinon.stub()
  };
  
  // Mock User model
  const User = {
    findById: sinon.stub()
  };
  
  // Mock Hotel model
  const Hotel = {
    findById: sinon.stub()
  };
  
  // Reset mocks before each test
  beforeEach(() => {
    Booking.find.reset();
    Booking.findById.reset();
    Booking.findByIdAndUpdate.reset();
    Booking.findByIdAndDelete.reset();
    Booking.countDocuments.reset();
    Booking.aggregate.reset();
    User.findById.reset();
    Hotel.findById.reset();
  });
  
  // Mock admin booking controller
  const adminBookingController = {
    // Get all bookings with pagination and filters
    getAllBookings: async (req, res) => {
      try {
        const { 
          page = 1, 
          limit = 10, 
          status, 
          searchTerm,
          sortBy = 'createdAt',
          sortOrder = 'desc',
          startDate,
          endDate
        } = req.query;
        
        // Build query
        let query = {};
        
        // Add status filter
        if (status) {
          query.status = status;
        }
        
        // Add date range filter
        if (startDate && endDate) {
          query.checkInDate = { $gte: new Date(startDate) };
          query.checkOutDate = { $lte: new Date(endDate) };
        } else if (startDate) {
          query.checkInDate = { $gte: new Date(startDate) };
        } else if (endDate) {
          query.checkOutDate = { $lte: new Date(endDate) };
        }
        
        // Add search term filter for hotel name or user name/email
        if (searchTerm) {
          query.$or = [
            { 'hotel.name': { $regex: searchTerm, $options: 'i' } },
            { 'user.name': { $regex: searchTerm, $options: 'i' } },
            { 'user.email': { $regex: searchTerm, $options: 'i' } }
          ];
        }
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Determine sort direction
        const sortDirection = sortOrder === 'asc' ? 1 : -1;
        
        // Execute query with population
        const bookings = await Booking.find(query)
          .sort({ [sortBy]: sortDirection })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('user', 'name email')
          .populate('hotel', 'name location');
        
        // Get total count for pagination
        const total = await Booking.countDocuments(query);
        
        return res.json({
          bookings,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
          }
        });
      } catch (error) {
        return res.status(500).json({ message: 'Server error' });
      }
    },
    
    // Get booking by ID
    getBookingById: async (req, res) => {
      try {
        const booking = await Booking.findById(req.params.id)
          .populate('user', 'name email phoneNumber')
          .populate('hotel', 'name location imageUrl');
        
        if (!booking) {
          return res.status(404).json({ message: 'Booking not found' });
        }
        
        return res.json(booking);
      } catch (error) {
        if (error.kind === 'ObjectId') {
          return res.status(400).json({ message: 'Invalid booking ID' });
        }
        return res.status(500).json({ message: 'Server error' });
      }
    },
    
    // Update booking status
    updateBookingStatus: async (req, res) => {
      try {
        const { status } = req.body;
        
        // Validate status
        const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
        if (!status || !validStatuses.includes(status)) {
          return res.status(400).json({ message: 'Invalid status' });
        }
        
        // Find booking
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
          return res.status(404).json({ message: 'Booking not found' });
        }
        
        // Update status
        booking.status = status;
        
        // Add note if provided
        if (req.body.adminNote) {
          booking.adminNotes = booking.adminNotes || [];
          booking.adminNotes.push({
            note: req.body.adminNote,
            addedBy: req.user.userId,
            addedAt: new Date()
          });
        }
        
        // Save booking
        const updatedBooking = await Booking.findByIdAndUpdate(
          req.params.id,
          { 
            $set: { 
              status,
              adminNotes: booking.adminNotes
            }
          },
          { new: true }
        )
        .populate('user', 'name email')
        .populate('hotel', 'name location');
        
        return res.json(updatedBooking);
      } catch (error) {
        if (error.kind === 'ObjectId') {
          return res.status(400).json({ message: 'Invalid booking ID' });
        }
        return res.status(500).json({ message: 'Server error' });
      }
    },
    
    // Get booking statistics
    getBookingStats: async (req, res) => {
      try {
        // Overall statistics
        const totalBookings = await Booking.countDocuments();
        const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
        const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
        const completedBookings = await Booking.countDocuments({ status: 'completed' });
        
        // Revenue statistics
        const revenue = await Booking.aggregate([
          { $match: { status: { $in: ['confirmed', 'completed'] } } },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        
        // Monthly booking counts
        const monthlyBookings = await Booking.aggregate([
          { 
            $group: { 
              _id: { 
                month: { $month: '$createdAt' }, 
                year: { $year: '$createdAt' } 
              },
              count: { $sum: 1 }
            } 
          },
          { $sort: { '_id.year': -1, '_id.month': -1 } },
          { $limit: 12 }
        ]);
        
        return res.json({
          totalBookings,
          confirmedBookings,
          cancelledBookings,
          completedBookings,
          revenue: revenue.length > 0 ? revenue[0].total : 0,
          monthlyBookings
        });
      } catch (error) {
        return res.status(500).json({ message: 'Server error' });
      }
    }
  };
  
  describe('getAllBookings', () => {
    it('should get all bookings with pagination', async () => {
      const mockBookings = [
        { 
          _id: 'booking123', 
          user: { name: 'Test User', email: 'test@example.com' },
          hotel: { name: 'Test Hotel', location: 'Test City' },
          checkInDate: new Date('2023-12-01'),
          checkOutDate: new Date('2023-12-05'),
          status: 'confirmed',
          totalPrice: 500
        },
        { 
          _id: 'booking456', 
          user: { name: 'Another User', email: 'another@example.com' },
          hotel: { name: 'Another Hotel', location: 'Another City' },
          checkInDate: new Date('2023-11-01'),
          checkOutDate: new Date('2023-11-05'),
          status: 'pending',
          totalPrice: 400
        }
      ];
      
      // Setup request query
      req.query = { page: '1', limit: '10' };
      
      // Setup mocks with proper chaining
      const mockFind = {
        sort: sinon.stub().returnsThis(),
        skip: sinon.stub().returnsThis(),
        limit: sinon.stub().returnsThis(),
        populate: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves(mockBookings)
      };
      
      const mockPopulate = sinon.stub().returnsThis();
      mockPopulate.onFirstCall().returnsThis();
      mockPopulate.onSecondCall().resolves(mockBookings);
      
      mockFind.populate = mockPopulate;
      Booking.find.returns(mockFind);
      
      Booking.countDocuments.resolves(2);
      
      await adminBookingController.getAllBookings(req, res);
      
      expect(Booking.find.calledOnce).to.be.true;
      expect(Booking.countDocuments.calledOnce).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('bookings');
      expect(response).to.have.property('pagination');
      expect(response.pagination).to.have.property('total', 2);
      expect(response.pagination).to.have.property('page', 1);
      expect(response.pagination).to.have.property('limit', 10);
    });
    
    it('should apply filters correctly', async () => {
      // Setup request query with filters
      req.query = { 
        status: 'confirmed',
        searchTerm: 'luxury',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        sortBy: 'totalPrice',
        sortOrder: 'desc'
      };
      
      // Setup mocks with proper chaining
      const mockFind = {
        sort: sinon.stub().returnsThis(),
        skip: sinon.stub().returnsThis(),
        limit: sinon.stub().returnsThis(),
        populate: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves([])
      };
      
      const mockPopulate = sinon.stub().returnsThis();
      mockPopulate.onFirstCall().returnsThis();
      mockPopulate.onSecondCall().resolves([]);
      
      mockFind.populate = mockPopulate;
      Booking.find.returns(mockFind);
      
      Booking.countDocuments.resolves(0);
      
      await adminBookingController.getAllBookings(req, res);
      
      expect(Booking.find.calledOnce).to.be.true;
      
      // Verify query includes filters
      const findArgs = Booking.find.firstCall.args[0];
      expect(findArgs).to.have.property('status', 'confirmed');
      expect(findArgs).to.have.property('checkInDate');
      expect(findArgs).to.have.property('checkOutDate');
      expect(findArgs).to.have.property('$or').that.is.an('array');
    });
  });
  
  describe('getBookingById', () => {
    it('should get a booking by ID', async () => {
      const mockBooking = { 
        _id: 'booking123', 
        user: { name: 'Test User', email: 'test@example.com' },
        hotel: { name: 'Test Hotel', location: 'Test City' },
        checkInDate: new Date('2023-12-01'),
        checkOutDate: new Date('2023-12-05'),
        status: 'confirmed',
        totalPrice: 500
      };
      
      // Setup request params
      req.params.id = 'booking123';
      
      // Setup mocks with proper chaining
      const mockFindById = {
        populate: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves(mockBooking)
      };
      
      const mockPopulate = sinon.stub().returnsThis();
      mockPopulate.onFirstCall().returnsThis();
      mockPopulate.onSecondCall().resolves(mockBooking);
      
      mockFindById.populate = mockPopulate;
      Booking.findById.returns(mockFindById);
      
      await adminBookingController.getBookingById(req, res);
      
      expect(Booking.findById.calledWith('booking123')).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.deep.equal(mockBooking);
    });
    
    it('should return 404 if booking not found', async () => {
      // Setup request params
      req.params.id = 'nonexistent';
      
      // Setup mocks with proper chaining
      const mockFindById = {
        populate: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves(null)
      };
      
      const mockPopulate = sinon.stub().returnsThis();
      mockPopulate.onFirstCall().returnsThis();
      mockPopulate.onSecondCall().resolves(null);
      
      mockFindById.populate = mockPopulate;
      Booking.findById.returns(mockFindById);
      
      await adminBookingController.getBookingById(req, res);
      
      expect(Booking.findById.calledWith('nonexistent')).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Booking not found' })).to.be.true;
    });
  });
  
  describe('updateBookingStatus', () => {
    it('should update booking status', async () => {
      const bookingId = 'booking123';
      const mockBooking = { 
        _id: bookingId, 
        status: 'pending',
        adminNotes: []
      };
      
      const mockUpdatedBooking = {
        ...mockBooking,
        status: 'confirmed',
        adminNotes: [{
          note: 'Manually confirmed by admin',
          addedBy: 'admin123',
          addedAt: new Date()
        }]
      };
      
      // Setup request
      req.params.id = bookingId;
      req.body = { 
        status: 'confirmed',
        adminNote: 'Manually confirmed by admin'
      };
      
      // Setup mocks
      Booking.findById.resolves(mockBooking);
      
      const mockFindByIdAndUpdate = {
        populate: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves(mockUpdatedBooking)
      };
      
      const mockPopulate = sinon.stub().returnsThis();
      mockPopulate.onFirstCall().returnsThis();
      mockPopulate.onSecondCall().resolves(mockUpdatedBooking);
      
      mockFindByIdAndUpdate.populate = mockPopulate;
      Booking.findByIdAndUpdate.returns(mockFindByIdAndUpdate);
      
      await adminBookingController.updateBookingStatus(req, res);
      
      expect(Booking.findById.calledWith(bookingId)).to.be.true;
      expect(Booking.findByIdAndUpdate.calledOnce).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.deep.equal(mockUpdatedBooking);
    });
    
    it('should return 400 for invalid status', async () => {
      // Setup request
      req.params.id = 'booking123';
      req.body = { status: 'invalid-status' };
      
      await adminBookingController.updateBookingStatus(req, res);
      
      expect(Booking.findById.called).to.be.false;
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Invalid status' })).to.be.true;
    });
  });
  
  describe('getBookingStats', () => {
    it('should return booking statistics', async () => {
      // Setup mocks
      Booking.countDocuments.withArgs().resolves(100);
      Booking.countDocuments.withArgs({ status: 'confirmed' }).resolves(70);
      Booking.countDocuments.withArgs({ status: 'cancelled' }).resolves(20);
      Booking.countDocuments.withArgs({ status: 'completed' }).resolves(10);
      
      Booking.aggregate.onFirstCall().resolves([{ _id: null, total: 50000 }]);
      Booking.aggregate.onSecondCall().resolves([
        { _id: { month: 1, year: 2023 }, count: 10 },
        { _id: { month: 2, year: 2023 }, count: 15 }
      ]);
      
      await adminBookingController.getBookingStats(req, res);
      
      expect(Booking.countDocuments.callCount).to.equal(4);
      expect(Booking.aggregate.calledTwice).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('totalBookings', 100);
      expect(response).to.have.property('confirmedBookings', 70);
      expect(response).to.have.property('cancelledBookings', 20);
      expect(response).to.have.property('completedBookings', 10);
      expect(response).to.have.property('revenue', 50000);
      expect(response).to.have.property('monthlyBookings').that.is.an('array');
    });
  });
}); 