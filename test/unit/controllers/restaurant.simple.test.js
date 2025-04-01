const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const proxyquire = require('proxyquire');

// Create model mocks
const RestaurantMock = {
  findById: sinon.stub(),
  findOne: sinon.stub(),
  find: sinon.stub(),
  create: sinon.stub(),
  findByIdAndUpdate: sinon.stub(),
  findByIdAndDelete: sinon.stub(),
  countDocuments: sinon.stub()
};

const ErrorLogMock = {
  create: sinon.stub()
};

// Create validation result mock
const validationResultMock = {
  isEmpty: sinon.stub().returns(true),
  array: sinon.stub().returns([])
};

// Import the controller with mocked dependencies
const restaurantController = proxyquire('../../../src/controllers/restaurantController', {
  '../models/Restaurant': RestaurantMock,
  '../models/ErrorLog': ErrorLogMock,
  'express-validator': {
    validationResult: () => validationResultMock
  }
});

// Load test setup
require('../../config/setup');

describe('Restaurant Controller Tests', function() {
  this.timeout(10000);

  // Test data
  let mockRestaurant;
  let mockUser;

  beforeEach(async () => {
    // Create mock data
    mockUser = {
      _id: new ObjectId(),
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin'
    };

    mockRestaurant = {
      _id: new ObjectId(),
      name: 'Test Restaurant',
      description: 'A test restaurant',
      cuisineType: ['Italian', 'Mediterranean'],
      priceLevel: 2,
      location: {
        type: 'Point',
        coordinates: [-74.0060, 40.7128]
      },
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country'
      },
      contactInfo: {
        phone: '123-456-7890',
        email: 'restaurant@test.com',
        website: 'http://testrestaurant.com'
      },
      businessHours: [
        {
          day: 'Monday',
          openTime: '09:00',
          closeTime: '22:00',
          isClosed: false
        }
      ],
      menu: [],
      averageRating: 4.5,
      reviews: [],
      reviewCount: 0,
      features: {
        delivery: true,
        takeout: true,
        reservations: true,
        outdoor: true,
        creditCards: true,
        alcohol: 'beer-wine',
        parking: 'street',
        wifi: true
      },
      images: ['image1.jpg', 'image2.jpg'],
      coverImage: 'default-restaurant.jpg',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Reset all stubs
    sinon.reset();

    // Stubs for Restaurant model methods
    RestaurantMock.findById.resolves(mockRestaurant);
    RestaurantMock.findOne.resolves(mockRestaurant);
    RestaurantMock.find = sinon.stub().returns({
      sort: sinon.stub().returnsThis(),
      skip: sinon.stub().returnsThis(),
      limit: sinon.stub().resolves([mockRestaurant])
    });
    RestaurantMock.findByIdAndUpdate.resolves(mockRestaurant);
    RestaurantMock.findByIdAndDelete.resolves(mockRestaurant);
    RestaurantMock.countDocuments.resolves(1);
    RestaurantMock.create.resolves(mockRestaurant);

    // Stub for ErrorLog model methods
    ErrorLogMock.create.resolves({});
  });

  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });

  describe('createRestaurant', () => {
    it('should create a new restaurant successfully', async () => {
      const req = {
        user: mockUser,
        body: {
          name: mockRestaurant.name,
          description: mockRestaurant.description,
          cuisineType: mockRestaurant.cuisineType,
          priceLevel: mockRestaurant.priceLevel,
          location: mockRestaurant.location,
          address: mockRestaurant.address,
          contactInfo: mockRestaurant.contactInfo,
          businessHours: mockRestaurant.businessHours,
          features: mockRestaurant.features,
          images: mockRestaurant.images
        }
      };

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      };

      await restaurantController.createRestaurant(req, res);

      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(RestaurantMock.create.calledOnce).to.be.true;
    });

    it('should return 400 if required fields are missing', async () => {
      validationResultMock.isEmpty.returns(false);
      validationResultMock.array.returns([
        { param: 'name', msg: 'Restaurant name is required' }
      ]);

      const req = {
        user: mockUser,
        body: {
          name: 'Test Restaurant'
          // Missing required fields
        }
      };

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      };

      await restaurantController.createRestaurant(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('Validation failed');
    });

    it('should handle validation errors', async () => {
      // Mock validation result to return errors
      validationResultMock.isEmpty.returns(false);
      validationResultMock.array.returns([
        { param: 'name', msg: 'Restaurant name is required' }
      ]);

      const req = {
        user: mockUser,
        body: mockRestaurant
      };

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      };

      await restaurantController.createRestaurant(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('Validation failed');
    });

    it('should handle server errors', async () => {
      // Mock validation result to pass
      validationResultMock.isEmpty.returns(true);
      validationResultMock.array.returns([]);

      // Mock create to reject with an error
      RestaurantMock.create.rejects(new Error('Database error'));

      const req = {
        user: mockUser,
        body: mockRestaurant
      };

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      };

      await restaurantController.createRestaurant(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.status).to.equal('error');
      expect(response.message).to.include('Failed to create restaurant');
    });
  });

  describe('getRestaurant', () => {
    it('should get a restaurant by id successfully', async () => {
      const req = {
        params: { id: mockRestaurant._id.toString() }
      };

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      };

      await restaurantController.getRestaurant(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('restaurant');
    });

    it('should return 404 if restaurant not found', async () => {
      RestaurantMock.findById.resolves(null);

      const req = {
        params: { id: new ObjectId().toString() }
      };

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      };

      await restaurantController.getRestaurant(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('Restaurant not found');
    });

    it('should handle server errors', async () => {
      RestaurantMock.findById.rejects(new Error('Database error'));

      const req = {
        params: { id: mockRestaurant._id.toString() }
      };

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      };

      await restaurantController.getRestaurant(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.status).to.equal('error');
      expect(response.message).to.include('Failed to retrieve restaurant');
    });
  });

  describe('getAllRestaurants', () => {
    beforeEach(() => {
      // Reset stubs with proper chaining
      const chainObj = {
        sort: function() { return chainObj; },
        skip: function() { return chainObj; },
        limit: function() { return Promise.resolve([mockRestaurant]); }
      };
      
      RestaurantMock.find.returns(chainObj);
      RestaurantMock.countDocuments.resolves(1);
      RestaurantMock.getRestaurantsNearby = sinon.stub().resolves([mockRestaurant]);
    });

    it('should get all restaurants successfully', async () => {
      const req = {
        query: {}
      };

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      };

      await restaurantController.getAllRestaurants(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('restaurants');
    });

    it('should apply filters when provided', async () => {
      const req = {
        query: {
          cuisineType: 'Italian',
          minPrice: 1,
          maxPrice: 3,
          rating: 4
        }
      };

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      };

      await restaurantController.getAllRestaurants(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('restaurants');
    });

    it('should handle server errors', async () => {
      RestaurantMock.find.throws(new Error('Database error'));

      const req = {
        query: {}
      };

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      };

      await restaurantController.getAllRestaurants(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.getCall(0).args[0];
      expect(response.status).to.equal('error');
      expect(response.message).to.include('Failed to retrieve restaurants');
    });
  });
}); 