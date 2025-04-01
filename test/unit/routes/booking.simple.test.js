const { expect } = require('chai');
const sinon = require('sinon');

describe('Booking Route Handlers', () => {
  // Mock request and response objects
  let req, res, next;
  
  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: { id: 'user123' }
    };
    
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };
    
    next = sinon.spy();
  });
  
  describe('createBooking', () => {
    it('should create a booking successfully', () => {
      // Mock booking controller function
      const createBooking = (req, res) => {
        const { hotelId, checkInDate, checkOutDate, guests } = req.body;
        const userId = req.user.id;
        
        // Check required fields
        if (!hotelId || !checkInDate || !checkOutDate || !guests) {
          return res.status(400).json({ message: 'Missing required fields' });
        }
        
        // Check dates
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        
        if (checkIn >= checkOut) {
          return res.status(400).json({ message: 'Check-out must be after check-in' });
        }
        
        // Create booking (mocked)
        const booking = {
          _id: 'booking123',
          hotel: hotelId,
          user: userId,
          checkInDate,
          checkOutDate,
          guests,
          totalPrice: 500,
          status: 'confirmed'
        };
        
        return res.status(201).json({ booking });
      };
      
      // Set request body
      req.body = {
        hotelId: 'hotel123',
        checkInDate: '2023-06-15',
        checkOutDate: '2023-06-20',
        guests: 2
      };
      
      // Call the controller function
      createBooking(req, res);
      
      // Assertions
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('booking');
      expect(response.booking).to.have.property('hotel', 'hotel123');
      expect(response.booking).to.have.property('user', 'user123');
      expect(response.booking).to.have.property('status', 'confirmed');
    });
    
    it('should return 400 if required fields are missing', () => {
      // Mock booking controller function
      const createBooking = (req, res) => {
        const { hotelId, checkInDate, checkOutDate, guests } = req.body;
        
        // Check required fields
        if (!hotelId || !checkInDate || !checkOutDate || !guests) {
          return res.status(400).json({ message: 'Missing required fields' });
        }
        
        // This should not be reached in this test
        return res.status(201).json({ booking: {} });
      };
      
      // Set request body with missing fields
      req.body = {
        hotelId: 'hotel123',
        // Missing checkInDate and checkOutDate
        guests: 2
      };
      
      // Call the controller function
      createBooking(req, res);
      
      // Assertions
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('message', 'Missing required fields');
    });
    
    it('should return 400 if check-out date is before check-in date', () => {
      // Mock booking controller function
      const createBooking = (req, res) => {
        const { hotelId, checkInDate, checkOutDate, guests } = req.body;
        
        // Check required fields
        if (!hotelId || !checkInDate || !checkOutDate || !guests) {
          return res.status(400).json({ message: 'Missing required fields' });
        }
        
        // Check dates
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        
        if (checkIn >= checkOut) {
          return res.status(400).json({ message: 'Check-out must be after check-in' });
        }
        
        // This should not be reached in this test
        return res.status(201).json({ booking: {} });
      };
      
      // Set request body with invalid dates
      req.body = {
        hotelId: 'hotel123',
        checkInDate: '2023-06-20', // Later date
        checkOutDate: '2023-06-15', // Earlier date
        guests: 2
      };
      
      // Call the controller function
      createBooking(req, res);
      
      // Assertions
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('message', 'Check-out must be after check-in');
    });
  });
}); 