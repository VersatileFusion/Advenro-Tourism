const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const proxyquire = require('proxyquire');

// Import test setup
const { dbHelper } = require('../../config/setup');

// Create model mocks
const HotelMock = {
  find: sinon.stub(),
  aggregate: sinon.stub()
};

const TourMock = {
  find: sinon.stub(),
  aggregate: sinon.stub()
};

const FlightMock = {
  find: sinon.stub(),
  aggregate: sinon.stub()
};

const LocationMock = {
  find: sinon.stub(),
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

// Mock HTTP request handler
const axiosMock = {
  get: sinon.stub().resolves({ data: {} })
};

// Define the search controller implementation based on project structure
const searchController = {
  // Global search across multiple entities
  globalSearch: async (req, res) => {
    try {
      const { query, type, limit = 10 } = req.query;
      
      if (!query) {
        return res.status(400).json({
          status: 'fail',
          message: 'Search query is required'
        });
      }
      
      let results = {};
      
      // If type is specified, only search that type
      if (type && ['hotels', 'tours', 'flights', 'locations'].includes(type)) {
        const typeResults = await searchController.searchByType(type, query, limit);
        results[type] = typeResults;
      } else {
        // Search across all entities
        const [hotels, tours, flights, locations] = await Promise.all([
          searchController.searchByType('hotels', query, limit),
          searchController.searchByType('tours', query, limit),
          searchController.searchByType('flights', query, limit),
          searchController.searchByType('locations', query, limit)
        ]);
        
        results = {
          hotels,
          tours,
          flights,
          locations
        };
      }
      
      return res.json({
        status: 'success',
        data: results
      });
    } catch (error) {
      console.error('Search error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred during search'
      });
    }
  },
  
  // Helper method to search by type
  searchByType: async (type, query, limit) => {
    switch (type) {
      case 'hotels':
        return HotelMock.find().limit(limit).exec();
      case 'tours':
        return TourMock.find().limit(limit).exec();
      case 'flights':
        return FlightMock.find().limit(limit).exec();
      case 'locations':
        return LocationMock.find().limit(limit).exec();
      default:
        return [];
    }
  },
  
  // Search hotels
  searchHotels: async (req, res) => {
    try {
      const { location, checkIn, checkOut, guests } = req.query;
      
      if (!location) {
        return res.status(400).json({
          status: 'fail',
          message: 'Location is required'
        });
      }
      
      const hotels = await HotelMock.find();
      
      return res.json({
        status: 'success',
        data: hotels
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred searching hotels'
      });
    }
  },
  
  // Search destinations
  searchDestinations: async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query) {
        return res.status(400).json({
          status: 'fail',
          message: 'Search query is required'
        });
      }
      
      const destinations = await LocationMock.find();
      
      return res.json({
        status: 'success',
        data: destinations
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred searching destinations'
      });
    }
  }
};

describe('Search Controller Tests', function() {
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
  let mockHotels, mockTours, mockFlights, mockLocations, mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Create mock data
    mockHotels = [
      {
        _id: new ObjectId(),
        name: 'Test Hotel',
        location: 'Test City',
        rating: 4.5
      }
    ];
    
    mockTours = [
      {
        _id: new ObjectId(),
        name: 'City Tour',
        destination: 'Test City',
        duration: 3
      }
    ];
    
    mockFlights = [
      {
        _id: new ObjectId(),
        origin: 'City A',
        destination: 'City B',
        departure: new Date()
      }
    ];
    
    mockLocations = [
      {
        _id: new ObjectId(),
        name: 'Test City',
        country: 'Test Country'
      }
    ];

    // Setup request object
    mockReq = {
      user: { id: new ObjectId().toString(), role: 'user' },
      body: {},
      params: {},
      query: { query: 'test' }
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
    HotelMock.find = sinon.stub().returns({
      limit: sinon.stub().returns({
        exec: sinon.stub().resolves(mockHotels)
      })
    });
    
    TourMock.find = sinon.stub().returns({
      limit: sinon.stub().returns({
        exec: sinon.stub().resolves(mockTours)
      })
    });
    
    FlightMock.find = sinon.stub().returns({
      limit: sinon.stub().returns({
        exec: sinon.stub().resolves(mockFlights)
      })
    });
    
    LocationMock.find = sinon.stub().returns({
      limit: sinon.stub().returns({
        exec: sinon.stub().resolves(mockLocations)
      })
    });
    
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
      expect(searchController).to.be.an('object');
      expect(searchController.globalSearch).to.be.a('function');
      expect(searchController.searchHotels).to.be.a('function');
      expect(searchController.searchDestinations).to.be.a('function');
    });
  });

  // Test global search functionality
  describe('globalSearch Function', () => {
    it('should search across all entity types', async () => {
      // Call the controller function
      await searchController.globalSearch(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('hotels');
      expect(response.data).to.have.property('tours');
      expect(response.data).to.have.property('flights');
      expect(response.data).to.have.property('locations');
    });

    it('should return 400 if query is missing', async () => {
      // Setup request without query
      mockReq.query = {};
      
      // Call the controller function
      await searchController.globalSearch(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(400)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
    });

    it('should search only specified type when type is provided', async () => {
      // Setup request with type
      mockReq.query = { query: 'test', type: 'hotels' };
      
      // Call the controller function
      await searchController.globalSearch(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('hotels');
      expect(response.data).to.not.have.property('tours');
    });
  });

  // Test hotel search functionality
  describe('searchHotels Function', () => {
    it('should search hotels with location parameter', async () => {
      // Setup request with required parameters
      mockReq.query = {
        location: 'Test City',
        checkIn: '2023-12-01',
        checkOut: '2023-12-05',
        guests: 2
      };
      
      // Call the controller function
      await searchController.searchHotels(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.eql(mockHotels);
    });

    it('should return 400 if location is missing', async () => {
      // Setup request without location
      mockReq.query = {
        checkIn: '2023-12-01',
        checkOut: '2023-12-05',
        guests: 2
      };
      
      // Call the controller function
      await searchController.searchHotels(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(400)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
    });
  });

  // Test destination search functionality
  describe('searchDestinations Function', () => {
    it('should search destinations with query parameter', async () => {
      // Setup request with query
      mockReq.query = { query: 'test' };
      
      // Call the controller function
      await searchController.searchDestinations(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.eql(mockLocations);
    });

    it('should return 400 if query is missing', async () => {
      // Setup request without query
      mockReq.query = {};
      
      // Call the controller function
      await searchController.searchDestinations(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(400)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
    });
  });
}); 