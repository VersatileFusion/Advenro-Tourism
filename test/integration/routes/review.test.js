const mongoose = require('mongoose');
const { expect } = require('chai');
const supertest = require('supertest');
const express = require('express');
const Review = require('../../../src/server/models/Review');
const User = require('../../../src/server/models/user');
const Hotel = require('../../../src/server/models/Hotel');
const reviewRoutes = require('../../../src/server/routes/review');
const { authenticate } = require('../../../src/server/middleware/auth');

describe('Review Routes Integration Tests', function() {
  let app, request, testUser, testHotel, testReview;
  let userToken;
  
  before(async function() {
    // This might take longer in CI environments
    this.timeout(10000);
    
    // Create Express app for testing
    app = express();
    app.use(express.json());
    
    // Setup mock authentication for testing
    app.use((req, res, next) => {
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];
        
        if (token === 'user-token') {
          req.user = { userId: testUser ? testUser._id.toString() : 'user123', role: 'user' };
        }
      }
      next();
    });
    
    // Use review routes
    app.use('/api/reviews', reviewRoutes);
    
    // Create supertest client
    request = supertest(app);
    
    // Create test user
    testUser = await User.create({
      name: 'Review Test User',
      email: 'reviewtester@example.com',
      password: 'password123',
      role: 'user',
      isVerified: true,
      firstName: 'Review',
      lastName: 'Tester'
    });
    
    // Save token for testing
    userToken = 'user-token';
    
    // Create test hotel
    testHotel = await Hotel.create({
      name: 'Hotel for Reviews',
      location: 'Test City',
      description: 'A hotel for testing reviews',
      pricePerNight: 100,
      amenities: ['WiFi', 'Breakfast'],
      rating: 4.0,
      imageUrl: 'https://example.com/review-hotel.jpg'
    });
    
    // Create test review
    testReview = await Review.create({
      user: testUser._id,
      hotel: testHotel._id,
      rating: 4,
      comment: 'This is a test review',
      date: new Date()
    });
  });
  
  after(async function() {
    // Clean up created data
    await Review.deleteMany({});
    await Hotel.deleteMany({});
    await User.deleteMany({});
  });
  
  describe('GET /api/reviews/hotel/:hotelId', () => {
    it('should get all reviews for a hotel', async () => {
      const res = await request.get(`/api/reviews/hotel/${testHotel._id}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(1);
      expect(res.body[0]).to.have.property('_id');
      expect(res.body[0]).to.have.property('rating', 4);
      expect(res.body[0]).to.have.property('comment', 'This is a test review');
      expect(res.body[0].user).to.have.property('name', 'Review Test User');
    });
    
    it('should return empty array if hotel has no reviews', async () => {
      // Create a hotel with no reviews
      const emptyHotel = await Hotel.create({
        name: 'No Review Hotel',
        location: 'Empty City',
        description: 'A hotel with no reviews',
        pricePerNight: 200,
        amenities: ['WiFi'],
        rating: 0,
        imageUrl: 'https://example.com/empty-hotel.jpg'
      });
      
      const res = await request.get(`/api/reviews/hotel/${emptyHotel._id}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body).to.be.empty;
    });
  });
  
  describe('GET /api/reviews/user', () => {
    it('should get all reviews created by the authenticated user', async () => {
      const res = await request
        .get('/api/reviews/user')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(1);
      expect(res.body[0]).to.have.property('_id');
      expect(res.body[0]).to.have.property('rating', 4);
      expect(res.body[0]).to.have.property('comment', 'This is a test review');
    });
    
    it('should return 401 without authentication', async () => {
      const res = await request.get('/api/reviews/user');
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message', 'No token provided');
    });
  });
  
  describe('POST /api/reviews', () => {
    it('should create a new review', async () => {
      // Create another hotel for a new review
      const anotherHotel = await Hotel.create({
        name: 'Another Review Hotel',
        location: 'Another City',
        description: 'Another hotel for testing reviews',
        pricePerNight: 150,
        amenities: ['WiFi', 'Pool'],
        rating: 3.5,
        imageUrl: 'https://example.com/another-hotel.jpg'
      });
      
      const newReview = {
        hotel: anotherHotel._id,
        rating: 5,
        comment: 'This is an excellent hotel!'
      };
      
      const res = await request
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newReview);
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('_id');
      expect(res.body).to.have.property('user', testUser._id.toString());
      expect(res.body).to.have.property('hotel', anotherHotel._id.toString());
      expect(res.body).to.have.property('rating', 5);
      expect(res.body).to.have.property('comment', 'This is an excellent hotel!');
      
      // Verify it was actually created in the database
      const created = await Review.findById(res.body._id);
      expect(created).to.not.be.null;
      
      // Verify hotel rating was updated
      const updatedHotel = await Hotel.findById(anotherHotel._id);
      expect(updatedHotel.rating).to.be.above(3.5); // Rating should have increased
    });
    
    it('should return 400 if required fields are missing', async () => {
      const invalidReview = {
        // Missing hotel field
        rating: 3,
        comment: 'Incomplete review'
      };
      
      const res = await request
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidReview);
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message');
    });
    
    it('should return 401 without authentication', async () => {
      const newReview = {
        hotel: testHotel._id,
        rating: 4,
        comment: 'This should fail without auth'
      };
      
      const res = await request
        .post('/api/reviews')
        .send(newReview);
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message', 'No token provided');
    });
  });
  
  describe('PUT /api/reviews/:id', () => {
    it('should update a review created by the user', async () => {
      const updates = {
        rating: 3,
        comment: 'Updated review comment'
      };
      
      const res = await request
        .put(`/api/reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updates);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('_id');
      expect(res.body).to.have.property('rating', 3);
      expect(res.body).to.have.property('comment', 'Updated review comment');
      
      // Verify it was actually updated in the database
      const updated = await Review.findById(testReview._id);
      expect(updated.rating).to.equal(3);
      expect(updated.comment).to.equal('Updated review comment');
      
      // Verify hotel rating was updated
      const updatedHotel = await Hotel.findById(testHotel._id);
      expect(updatedHotel.rating).to.not.equal(4.0); // Rating should have changed
    });
    
    it('should return 404 if review not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request
        .put(`/api/reviews/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 2,
          comment: 'This should fail'
        });
      
      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('message', 'Review not found');
    });
    
    it('should return 401 without authentication', async () => {
      const res = await request
        .put(`/api/reviews/${testReview._id}`)
        .send({
          rating: 1,
          comment: 'This should fail without auth'
        });
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message', 'No token provided');
    });
  });
  
  describe('DELETE /api/reviews/:id', () => {
    it('should delete a review created by the user', async () => {
      // Create a review for deletion
      const deleteReview = await Review.create({
        user: testUser._id,
        hotel: testHotel._id,
        rating: 2,
        comment: 'This review will be deleted',
        date: new Date()
      });
      
      const res = await request
        .delete(`/api/reviews/${deleteReview._id}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message', 'Review deleted successfully');
      
      // Verify it was actually deleted from the database
      const deleted = await Review.findById(deleteReview._id);
      expect(deleted).to.be.null;
      
      // Verify hotel rating was updated
      const updatedHotel = await Hotel.findById(testHotel._id);
      expect(updatedHotel.rating).to.not.equal(4.0); // Rating should have changed after deletion
    });
    
    it('should return 404 if review not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request
        .delete(`/api/reviews/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('message', 'Review not found');
    });
    
    it('should return 401 without authentication', async () => {
      const res = await request
        .delete(`/api/reviews/${testReview._id}`);
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message', 'No token provided');
    });
  });
}); 