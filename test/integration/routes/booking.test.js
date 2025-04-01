const mongoose = require('mongoose');
const { expect } = require('chai');
const supertest = require('supertest');
const express = require('express');
const Booking = require('../../../src/server/models/booking');
const User = require('../../../src/server/models/user');
const Hotel = require('../../../src/server/models/Hotel');
const bookingRoutes = require('../../../src/server/routes/booking');
const { authenticate } = require('../../../src/server/middleware/auth');

describe('Booking Routes Integration Tests', function() {
  let app, request, testUser, testHotel, testBooking;
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
    
    // Use booking routes
    app.use('/api/bookings', bookingRoutes);
    
    // Create supertest client
    request = supertest(app);
    
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123',
      role: 'user',
      isVerified: true,
      firstName: 'Test',
      lastName: 'User'
    });
    
    // Save token for testing
    userToken = 'user-token';
    
    // Create test hotel
    testHotel = await Hotel.create({
      name: 'Test Hotel',
      location: 'Test Location',
      description: 'A hotel for testing purposes',
      pricePerNight: 100,
      amenities: ['WiFi', 'Breakfast'],
      rating: 4.5,
      imageUrl: 'https://example.com/hotel.jpg'
    });
    
    // Create test booking
    testBooking = await Booking.create({
      user: testUser._id,
      hotel: testHotel._id,
      checkInDate: new Date('2023-12-01'),
      checkOutDate: new Date('2023-12-05'),
      totalPrice: 400,
      status: 'confirmed',
      paymentStatus: 'paid'
    });
  });
  
  after(async function() {
    // Clean up created data
    await Booking.deleteMany({});
    await Hotel.deleteMany({});
    await User.deleteMany({});
  });
  
  describe('GET /api/bookings', () => {
    it('should get user\'s bookings with authentication', async () => {
      const res = await request
        .get('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(1);
      expect(res.body[0]).to.have.property('_id');
      expect(res.body[0]).to.have.property('hotel');
      expect(res.body[0]).to.have.property('checkInDate');
    });
    
    it('should return 401 without authentication', async () => {
      const res = await request.get('/api/bookings');
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message', 'No token provided');
    });
  });
  
  describe('GET /api/bookings/:id', () => {
    it('should get a booking by ID', async () => {
      const res = await request
        .get(`/api/bookings/${testBooking._id}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('_id');
      expect(res.body).to.have.property('hotel');
      expect(res.body).to.have.property('checkInDate');
      expect(new Date(res.body.checkInDate)).to.deep.equal(new Date('2023-12-01'));
    });
    
    it('should return 404 if booking not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request
        .get(`/api/bookings/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('message', 'Booking not found');
    });
    
    it('should return 401 without authentication', async () => {
      const res = await request.get(`/api/bookings/${testBooking._id}`);
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message', 'No token provided');
    });
  });
  
  describe('POST /api/bookings', () => {
    it('should create a new booking', async () => {
      const newBooking = {
        hotel: testHotel._id,
        checkInDate: '2023-12-10',
        checkOutDate: '2023-12-15',
        totalPrice: 500,
        status: 'pending',
        paymentStatus: 'pending'
      };
      
      const res = await request
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newBooking);
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('_id');
      expect(res.body).to.have.property('user', testUser._id.toString());
      expect(res.body).to.have.property('hotel', testHotel._id.toString());
      expect(res.body).to.have.property('totalPrice', 500);
      
      // Verify it was actually created in the database
      const created = await Booking.findById(res.body._id);
      expect(created).to.not.be.null;
    });
    
    it('should return 400 if required fields are missing', async () => {
      const invalidBooking = {
        // Missing hotel field
        checkInDate: '2023-12-10',
        checkOutDate: '2023-12-15'
      };
      
      const res = await request
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidBooking);
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message');
    });
    
    it('should return 401 without authentication', async () => {
      const newBooking = {
        hotel: testHotel._id,
        checkInDate: '2023-12-10',
        checkOutDate: '2023-12-15',
        totalPrice: 500
      };
      
      const res = await request
        .post('/api/bookings')
        .send(newBooking);
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message', 'No token provided');
    });
  });
  
  describe('PUT /api/bookings/:id', () => {
    it('should update a booking', async () => {
      const updates = {
        checkInDate: '2023-12-02',
        checkOutDate: '2023-12-07',
        totalPrice: 500,
        status: 'modified'
      };
      
      const res = await request
        .put(`/api/bookings/${testBooking._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updates);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('_id');
      expect(res.body).to.have.property('status', 'modified');
      expect(res.body).to.have.property('totalPrice', 500);
      
      // Verify it was actually updated in the database
      const updated = await Booking.findById(testBooking._id);
      expect(updated.status).to.equal('modified');
      expect(updated.totalPrice).to.equal(500);
    });
    
    it('should return 404 if booking not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request
        .put(`/api/bookings/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'modified'
        });
      
      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('message', 'Booking not found');
    });
    
    it('should return 401 without authentication', async () => {
      const res = await request
        .put(`/api/bookings/${testBooking._id}`)
        .send({
          status: 'modified'
        });
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message', 'No token provided');
    });
  });
  
  describe('DELETE /api/bookings/:id', () => {
    it('should cancel a booking', async () => {
      // Create a booking for cancellation
      const cancelBooking = await Booking.create({
        user: testUser._id,
        hotel: testHotel._id,
        checkInDate: new Date('2023-12-20'),
        checkOutDate: new Date('2023-12-25'),
        totalPrice: 500,
        status: 'confirmed',
        paymentStatus: 'paid'
      });
      
      const res = await request
        .delete(`/api/bookings/${cancelBooking._id}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message', 'Booking cancelled successfully');
      
      // Verify it was actually updated to cancelled in the database
      const cancelled = await Booking.findById(cancelBooking._id);
      expect(cancelled.status).to.equal('cancelled');
    });
    
    it('should return 404 if booking not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request
        .delete(`/api/bookings/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('message', 'Booking not found');
    });
    
    it('should return 401 without authentication', async () => {
      const res = await request
        .delete(`/api/bookings/${testBooking._id}`);
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message', 'No token provided');
    });
  });
}); 