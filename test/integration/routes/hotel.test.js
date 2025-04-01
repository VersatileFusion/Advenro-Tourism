const chai = require('chai');
const expect = chai.expect;
const { getRequest, postRequest, putRequest, deleteRequest } = require('../../helpers/request-helper');
const { createUserWithToken, createAdminWithToken } = require('../../helpers/auth-helper');
const Hotel = require('../../../src/server/models/hotel');

// Load test setup
require('../../config/setup');

describe('Hotel Routes', function() {
  this.timeout(10000);
  
  let userToken, adminToken;
  let testHotelId;
  
  const testHotel = {
    name: 'API Test Hotel',
    description: 'A hotel created by API tests',
    address: {
      street: '123 API St',
      city: 'Test City',
      state: 'Test State',
      country: 'Testland',
      zipCode: '12345'
    },
    price: 175,
    rating: 4.2,
    amenities: ['WiFi', 'Pool', 'Breakfast'],
    images: ['test1.jpg', 'test2.jpg']
  };
  
  // Create a user and admin user before tests
  before(async () => {
    // Create normal user with token
    const user = await createUserWithToken();
    userToken = user.token;
    
    // Create admin user with token
    const admin = await createAdminWithToken();
    adminToken = admin.token;
    
    // Create a test hotel for testing GET, PUT, DELETE
    const hotel = new Hotel(testHotel);
    const savedHotel = await hotel.save();
    testHotelId = savedHotel._id.toString();
  });
  
  describe('GET /api/hotels', () => {
    it('should get all hotels', async () => {
      const res = await getRequest('/api/hotels');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(1);
      
      // Check if the test hotel is in the response
      const testHotelExists = res.body.some(hotel => hotel.name === testHotel.name);
      expect(testHotelExists).to.be.true;
    });
    
    it('should filter hotels by price range', async () => {
      const minPrice = 150;
      const maxPrice = 200;
      
      const res = await getRequest(`/api/hotels?minPrice=${minPrice}&maxPrice=${maxPrice}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      
      // All returned hotels should be within the price range
      res.body.forEach(hotel => {
        expect(hotel.price).to.be.at.least(minPrice);
        expect(hotel.price).to.be.at.most(maxPrice);
      });
    });
    
    it('should filter hotels by amenities', async () => {
      const amenities = 'WiFi,Pool';
      
      const res = await getRequest(`/api/hotels?amenities=${amenities}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      
      // All returned hotels should have the specified amenities
      const requiredAmenities = amenities.split(',');
      res.body.forEach(hotel => {
        requiredAmenities.forEach(amenity => {
          expect(hotel.amenities).to.include(amenity);
        });
      });
    });
  });
  
  describe('GET /api/hotels/:id', () => {
    it('should get a hotel by ID', async () => {
      const res = await getRequest(`/api/hotels/${testHotelId}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object');
      expect(res.body._id).to.equal(testHotelId);
      expect(res.body.name).to.equal(testHotel.name);
      expect(res.body.description).to.equal(testHotel.description);
      expect(res.body.price).to.equal(testHotel.price);
    });
    
    it('should return 404 for non-existent hotel ID', async () => {
      const nonExistentId = '6432a7c2f3a7b123456789ab'; // Valid format but doesn't exist
      
      const res = await getRequest(`/api/hotels/${nonExistentId}`);
      
      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('message');
    });
    
    it('should return 400 for invalid hotel ID format', async () => {
      const invalidId = 'invalid-id-format';
      
      const res = await getRequest(`/api/hotels/${invalidId}`);
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message');
    });
  });
  
  describe('POST /api/hotels', () => {
    it('should create a new hotel when authenticated as admin', async () => {
      const newHotel = {
        name: 'New Test Hotel',
        description: 'A newly created hotel',
        address: {
          street: '456 New St',
          city: 'New City',
          state: 'New State',
          country: 'Newland',
          zipCode: '54321'
        },
        price: 225,
        rating: 4.8,
        amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant'],
        images: ['new1.jpg', 'new2.jpg']
      };
      
      const res = await postRequest('/api/hotels', newHotel, adminToken);
      
      expect(res.status).to.equal(201);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('_id');
      expect(res.body.name).to.equal(newHotel.name);
      expect(res.body.description).to.equal(newHotel.description);
      expect(res.body.price).to.equal(newHotel.price);
    });
    
    it('should not create a hotel without authentication', async () => {
      const newHotel = {
        name: 'Unauthorized Hotel',
        description: 'Should not be created',
        address: {
          street: '123 Unauth St',
          city: 'Unauth City',
          state: 'Unauth State',
          country: 'Unauthland',
          zipCode: '11111'
        },
        price: 100,
        rating: 3.0,
        amenities: ['WiFi'],
        images: ['unauth.jpg']
      };
      
      const res = await postRequest('/api/hotels', newHotel);
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message');
    });
    
    it('should not create a hotel with missing required fields', async () => {
      const invalidHotel = {
        // Missing name and other required fields
        description: 'Invalid hotel',
        price: 150
      };
      
      const res = await postRequest('/api/hotels', invalidHotel, adminToken);
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message');
    });
  });
  
  describe('PUT /api/hotels/:id', () => {
    it('should update a hotel when authenticated as admin', async () => {
      const updates = {
        name: 'Updated Hotel Name',
        description: 'Updated description',
        price: 200
      };
      
      const res = await putRequest(`/api/hotels/${testHotelId}`, updates, adminToken);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object');
      expect(res.body._id).to.equal(testHotelId);
      expect(res.body.name).to.equal(updates.name);
      expect(res.body.description).to.equal(updates.description);
      expect(res.body.price).to.equal(updates.price);
      // Check that other fields remain unchanged
      expect(res.body.rating).to.equal(testHotel.rating);
    });
    
    it('should not update a hotel without authentication', async () => {
      const updates = {
        name: 'Unauthorized Update',
        price: 999
      };
      
      const res = await putRequest(`/api/hotels/${testHotelId}`, updates);
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message');
    });
  });
  
  describe('DELETE /api/hotels/:id', () => {
    it('should delete a hotel when authenticated as admin', async () => {
      // First, create a hotel to delete
      const hotelToDelete = new Hotel({
        name: 'Delete Test Hotel',
        description: 'A hotel to be deleted',
        address: {
          street: '789 Delete St',
          city: 'Delete City',
          state: 'Delete State',
          country: 'Deleteland',
          zipCode: '99999'
        },
        price: 125,
        rating: 3.9,
        amenities: ['WiFi'],
        images: ['delete.jpg']
      });
      
      const savedHotel = await hotelToDelete.save();
      const hotelToDeleteId = savedHotel._id.toString();
      
      const res = await deleteRequest(`/api/hotels/${hotelToDeleteId}`, adminToken);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object');
      expect(res.body.message).to.include('deleted');
      
      // Verify that the hotel was actually deleted
      const deletedHotel = await Hotel.findById(hotelToDeleteId);
      expect(deletedHotel).to.be.null;
    });
    
    it('should not delete a hotel without authentication', async () => {
      const res = await deleteRequest(`/api/hotels/${testHotelId}`);
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message');
      
      // Verify that the hotel still exists
      const hotel = await Hotel.findById(testHotelId);
      expect(hotel).to.not.be.null;
    });
  });
}); 