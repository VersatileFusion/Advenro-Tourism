const chai = require('chai');
const expect = chai.expect;
const { getRequest, postRequest, putRequest, deleteRequest } = require('../../helpers/request-helper');
const { createUserWithToken, createAdminWithToken } = require('../../helpers/auth-helper');
const Tour = require('../../../src/models/Tour');
const mongoose = require('mongoose');

// Load test setup
require('../../config/setup');

describe('Tours Routes', function() {
  this.timeout(10000);
  
  let userToken, adminToken, guideToken;
  let testTourId;
  
  const testTour = {
    name: 'API Test Tour',
    description: 'A tour created by API tests',
    duration: 5,
    maxGroupSize: 10,
    difficulty: 'medium',
    price: 299,
    summary: 'Test tour for API testing',
    imageCover: 'test-cover.jpg',
    images: ['test1.jpg', 'test2.jpg'],
    startDates: [
      new Date().toISOString(),
      new Date(Date.now() + 30*24*60*60*1000).toISOString()
    ],
    locations: [
      {
        type: 'Point',
        coordinates: [-73.985130, 40.758896],
        description: 'New York',
        day: 1
      }
    ]
  };
  
  // Create users and test tour before tests
  before(async () => {
    // Create regular user with token
    const user = await createUserWithToken();
    userToken = user.token;
    
    // Create admin user with token
    const admin = await createAdminWithToken();
    adminToken = admin.token;
    
    // Create guide user with token
    const guide = await createUserWithToken({ role: 'guide' });
    guideToken = guide.token;
    
    // Create a test tour for testing GET, PUT, DELETE
    const tour = new Tour(testTour);
    const savedTour = await tour.save();
    testTourId = savedTour._id.toString();
  });
  
  describe('GET /tours', () => {
    it('should get all tours', async () => {
      const res = await getRequest('/tours');
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.be.at.least(1);
      
      // Check if the test tour is in the response
      const testTourExists = res.body.data.some(tour => tour.name === testTour.name);
      expect(testTourExists).to.be.true;
    });
    
    it('should filter tours by price range', async () => {
      const minPrice = 200;
      const maxPrice = 300;
      
      const res = await getRequest(`/tours?minPrice=${minPrice}&maxPrice=${maxPrice}`);
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
      
      // All returned tours should be within the price range
      res.body.data.forEach(tour => {
        expect(tour.price).to.be.at.least(minPrice);
        expect(tour.price).to.be.at.most(maxPrice);
      });
    });
    
    it('should filter tours by difficulty', async () => {
      const difficulty = 'medium';
      
      const res = await getRequest(`/tours?difficulty=${difficulty}`);
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
      
      // All returned tours should have the specified difficulty
      res.body.data.forEach(tour => {
        expect(tour.difficulty).to.equal(difficulty);
      });
    });
  });
  
  describe('GET /tours/:id', () => {
    it('should get a tour by ID', async () => {
      const res = await getRequest(`/tours/${testTourId}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object');
      expect(res.body._id).to.equal(testTourId);
      expect(res.body.name).to.equal(testTour.name);
      expect(res.body.description).to.equal(testTour.description);
      expect(res.body.price).to.equal(testTour.price);
    });
    
    it('should return 404 for non-existent tour ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      const res = await getRequest(`/tours/${nonExistentId}`);
      
      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('message');
    });
    
    it('should return 400 for invalid tour ID format', async () => {
      const invalidId = 'invalid-id-format';
      
      const res = await getRequest(`/tours/${invalidId}`);
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message');
    });
  });
  
  describe('POST /tours', () => {
    it('should create a new tour when authenticated as admin', async () => {
      const newTour = {
        name: 'New Test Tour',
        description: 'A newly created tour for testing',
        duration: 7,
        maxGroupSize: 15,
        difficulty: 'easy',
        price: 399,
        summary: 'Brand new test tour',
        imageCover: 'new-cover.jpg',
        images: ['new1.jpg', 'new2.jpg'],
        startDates: [
          new Date(Date.now() + 60*24*60*60*1000).toISOString()
        ]
      };
      
      const res = await postRequest('/tours', newTour, adminToken);
      
      expect(res.status).to.equal(201);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('_id');
      expect(res.body.name).to.equal(newTour.name);
      expect(res.body.description).to.equal(newTour.description);
      expect(res.body.price).to.equal(newTour.price);
      
      // Save the ID for cleanup
      const createdTourId = res.body._id;
      after(async () => {
        await Tour.findByIdAndDelete(createdTourId);
      });
    });
    
    it('should allow guide to create tour', async () => {
      const guideTour = {
        name: 'Guide Tour',
        description: 'A tour created by a guide',
        duration: 3,
        maxGroupSize: 8,
        difficulty: 'easy',
        price: 199,
        summary: 'Guide test tour',
        imageCover: 'guide-cover.jpg'
      };
      
      const res = await postRequest('/tours', guideTour, guideToken);
      
      expect(res.status).to.equal(201);
      expect(res.body).to.be.an('object');
      expect(res.body.name).to.equal(guideTour.name);
      
      // Save the ID for cleanup
      const createdTourId = res.body._id;
      after(async () => {
        await Tour.findByIdAndDelete(createdTourId);
      });
    });
    
    it('should not create a tour without authentication', async () => {
      const newTour = {
        name: 'Unauthorized Tour',
        description: 'Should not be created',
        duration: 2,
        price: 99
      };
      
      const res = await postRequest('/tours', newTour);
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message');
    });
    
    it('should not allow regular user to create tour', async () => {
      const newTour = {
        name: 'Regular User Tour',
        description: 'Should not be created',
        duration: 2,
        price: 99
      };
      
      const res = await postRequest('/tours', newTour, userToken);
      
      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('message');
    });
  });
  
  describe('PUT /tours/:id', () => {
    it('should update a tour when authenticated as admin', async () => {
      const updates = {
        name: 'Updated Tour Name',
        description: 'Updated description',
        price: 329
      };
      
      const res = await putRequest(`/tours/${testTourId}`, updates, adminToken);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object');
      expect(res.body._id).to.equal(testTourId);
      expect(res.body.name).to.equal(updates.name);
      expect(res.body.description).to.equal(updates.description);
      expect(res.body.price).to.equal(updates.price);
    });
    
    it('should not update tour without authentication', async () => {
      const updates = {
        name: 'Unauthorized Update'
      };
      
      const res = await putRequest(`/tours/${testTourId}`, updates);
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message');
    });
    
    it('should allow guide to update tour', async () => {
      const updates = {
        summary: 'Updated by guide',
        difficulty: 'difficult'
      };
      
      const res = await putRequest(`/tours/${testTourId}`, updates, guideToken);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object');
      expect(res.body._id).to.equal(testTourId);
      expect(res.body.summary).to.equal(updates.summary);
      expect(res.body.difficulty).to.equal(updates.difficulty);
    });
  });
  
  describe('DELETE /tours/:id', () => {
    // Create a tour to delete
    let tourToDeleteId;
    
    before(async () => {
      const tourToDelete = new Tour({
        name: 'Tour To Delete',
        description: 'This tour will be deleted',
        duration: 1,
        maxGroupSize: 5,
        difficulty: 'easy',
        price: 99
      });
      
      const savedTour = await tourToDelete.save();
      tourToDeleteId = savedTour._id.toString();
    });
    
    it('should not delete tour without authentication', async () => {
      const res = await deleteRequest(`/tours/${tourToDeleteId}`);
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message');
      
      // Verify tour still exists
      const tourExists = await Tour.findById(tourToDeleteId);
      expect(tourExists).to.not.be.null;
    });
    
    it('should not allow guide to delete tour', async () => {
      const res = await deleteRequest(`/tours/${tourToDeleteId}`, guideToken);
      
      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('message');
      
      // Verify tour still exists
      const tourExists = await Tour.findById(tourToDeleteId);
      expect(tourExists).to.not.be.null;
    });
    
    it('should delete a tour when authenticated as admin', async () => {
      const res = await deleteRequest(`/tours/${tourToDeleteId}`, adminToken);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message');
      expect(res.body.message).to.include('deleted');
      
      // Verify tour no longer exists
      const tourExists = await Tour.findById(tourToDeleteId);
      expect(tourExists).to.be.null;
    });
  });
}); 