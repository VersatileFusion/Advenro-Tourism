const request = require('supertest');
const { expect } = require('chai');
const { app, connectDB, clearDatabase, createTestUser, generateTestToken } = require('./test-helper');
const { Hotel } = require('../models/Hotel');
const { Booking } = require('../models/Booking');

describe('Payment Routes', () => {
  let user, hotel, adminUser, userToken, adminToken;

  before(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    user = await createTestUser('user');
    adminUser = await createTestUser('admin');
    userToken = generateTestToken(user);
    adminToken = generateTestToken(adminUser);
    hotel = await Hotel.create({
      name: 'Test Hotel',
      location: 'Test City',
      price: 200
    });
  });

  describe('POST /api/payments/create-intent', () => {
    it('should create payment intent when authenticated', async () => {
      const booking = await Booking.create({
        user: user._id,
        hotel: hotel._id,
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 86400000),
        totalPrice: 200
      });

      const response = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bookingId: booking._id });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('clientSecret');
      expect(response.body).to.have.property('paymentIntentId');
    });

    it('should not create payment intent without authentication', async () => {
      const booking = await Booking.create({
        user: user._id,
        hotel: hotel._id,
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 86400000),
        totalPrice: 200
      });

      const response = await request(app)
        .post('/api/payments/create-intent')
        .send({ bookingId: booking._id });

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('error');
    });

    it('should not create payment intent for non-existent booking', async () => {
      const response = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bookingId: '123456789012345678901234' });

      expect(response.status).to.equal(404);
      expect(response.body).to.have.property('error');
    });
  });

  describe('POST /api/payments/confirm', () => {
    it('should confirm payment when authenticated', async () => {
      const booking = await Booking.create({
        user: user._id,
        hotel: hotel._id,
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 86400000),
        totalPrice: 200,
        paymentIntentId: 'pi_test_123'
      });

      const response = await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          bookingId: booking._id,
          paymentIntentId: 'pi_test_123'
        });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('message');
      expect(response.body).to.have.property('booking');
      expect(response.body.booking).to.have.property('paymentStatus', 'paid');
    });

    it('should not confirm payment without authentication', async () => {
      const booking = await Booking.create({
        user: user._id,
        hotel: hotel._id,
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 86400000),
        totalPrice: 200,
        paymentIntentId: 'pi_test_123'
      });

      const response = await request(app)
        .post('/api/payments/confirm')
        .send({
          bookingId: booking._id,
          paymentIntentId: 'pi_test_123'
        });

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('error');
    });
  });

  describe('GET /api/payments/history', () => {
    it('should get payment history when authenticated', async () => {
      const booking1 = await Booking.create({
        user: user._id,
        hotel: hotel._id,
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 86400000),
        totalPrice: 200,
        paymentStatus: 'paid'
      });

      const booking2 = await Booking.create({
        user: user._id,
        hotel: hotel._id,
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 86400000),
        totalPrice: 300,
        paymentStatus: 'paid'
      });

      const response = await request(app)
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
    });

    it('should not get payment history without authentication', async () => {
      const response = await request(app)
        .get('/api/payments/history');

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('error');
    });
  });

  describe('POST /api/payments/refund', () => {
    it('should process refund when admin', async () => {
      const booking = await Booking.create({
        user: user._id,
        hotel: hotel._id,
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 86400000),
        totalPrice: 200,
        paymentStatus: 'paid',
        paymentIntentId: 'pi_test_123'
      });

      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bookingId: booking._id,
          reason: 'Customer request'
        });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('message');
      expect(response.body).to.have.property('refundId');
    });

    it('should not allow non-admin to process refund', async () => {
      const booking = await Booking.create({
        user: user._id,
        hotel: hotel._id,
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 86400000),
        totalPrice: 200,
        paymentStatus: 'paid',
        paymentIntentId: 'pi_test_123'
      });

      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          bookingId: booking._id,
          reason: 'Customer request'
        });

      expect(response.status).to.equal(403);
      expect(response.body).to.have.property('error');
    });
  });
}); 