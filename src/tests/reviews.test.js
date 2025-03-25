const request = require('supertest');
const { expect } = require('chai');
const { app, connectDB, clearDatabase, createTestUser, generateTestToken } = require('./test-helper');
const { Hotel } = require('../models/Hotel');
const { Review } = require('../models/Review');

describe('Review Routes', () => {
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

  describe('POST /api/reviews', () => {
    it('should create a new review when authenticated', async () => {
      const reviewData = {
        hotel: hotel._id,
        rating: 4,
        comment: 'Great hotel!'
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send(reviewData);

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('hotel', hotel._id.toString());
      expect(response.body).to.have.property('user', user._id.toString());
      expect(response.body).to.have.property('rating', reviewData.rating);
      expect(response.body).to.have.property('comment', reviewData.comment);
    });

    it('should not create review without authentication', async () => {
      const reviewData = {
        hotel: hotel._id,
        rating: 4,
        comment: 'Great hotel!'
      };

      const response = await request(app)
        .post('/api/reviews')
        .send(reviewData);

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('error');
    });

    it('should not create review for non-existent hotel', async () => {
      const reviewData = {
        hotel: '123456789012345678901234',
        rating: 4,
        comment: 'Great hotel!'
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send(reviewData);

      expect(response.status).to.equal(404);
      expect(response.body).to.have.property('error');
    });
  });

  describe('GET /api/reviews/hotel/:hotelId', () => {
    it('should get all reviews for a hotel', async () => {
      const review1 = await Review.create({
        hotel: hotel._id,
        user: user._id,
        rating: 4,
        comment: 'Great hotel!'
      });

      const review2 = await Review.create({
        hotel: hotel._id,
        user: adminUser._id,
        rating: 5,
        comment: 'Excellent stay!'
      });

      const response = await request(app)
        .get(`/api/reviews/hotel/${hotel._id}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body[0]).to.have.property('hotel', hotel._id.toString());
      expect(response.body[1]).to.have.property('hotel', hotel._id.toString());
    });
  });

  describe('GET /api/reviews/user/:userId', () => {
    it('should get all reviews by a user', async () => {
      const review1 = await Review.create({
        hotel: hotel._id,
        user: user._id,
        rating: 4,
        comment: 'Great hotel!'
      });

      const review2 = await Review.create({
        hotel: hotel._id,
        user: user._id,
        rating: 5,
        comment: 'Another great stay!'
      });

      const response = await request(app)
        .get(`/api/reviews/user/${user._id}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body[0]).to.have.property('user', user._id.toString());
      expect(response.body[1]).to.have.property('user', user._id.toString());
    });
  });

  describe('GET /api/reviews/:id', () => {
    it('should get review by id', async () => {
      const review = await Review.create({
        hotel: hotel._id,
        user: user._id,
        rating: 4,
        comment: 'Great hotel!'
      });

      const response = await request(app)
        .get(`/api/reviews/${review._id}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('_id', review._id.toString());
    });

    it('should return 404 for non-existent review', async () => {
      const response = await request(app)
        .get('/api/reviews/123456789012345678901234');

      expect(response.status).to.equal(404);
      expect(response.body).to.have.property('error');
    });
  });

  describe('PUT /api/reviews/:id', () => {
    it('should update own review', async () => {
      const review = await Review.create({
        hotel: hotel._id,
        user: user._id,
        rating: 4,
        comment: 'Great hotel!'
      });

      const updateData = {
        rating: 5,
        comment: 'Even better than before!'
      };

      const response = await request(app)
        .put(`/api/reviews/${review._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('rating', updateData.rating);
      expect(response.body).to.have.property('comment', updateData.comment);
    });

    it('should not update review of another user', async () => {
      const review = await Review.create({
        hotel: hotel._id,
        user: adminUser._id,
        rating: 4,
        comment: 'Great hotel!'
      });

      const updateData = {
        rating: 2,
        comment: 'Not so great'
      };

      const response = await request(app)
        .put(`/api/reviews/${review._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).to.equal(403);
      expect(response.body).to.have.property('error');
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    it('should delete own review', async () => {
      const review = await Review.create({
        hotel: hotel._id,
        user: user._id,
        rating: 4,
        comment: 'Great hotel!'
      });

      const response = await request(app)
        .delete(`/api/reviews/${review._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('message');

      // Verify review is deleted
      const getResponse = await request(app)
        .get(`/api/reviews/${review._id}`);
      expect(getResponse.status).to.equal(404);
    });

    it('should not delete review of another user', async () => {
      const review = await Review.create({
        hotel: hotel._id,
        user: adminUser._id,
        rating: 4,
        comment: 'Great hotel!'
      });

      const response = await request(app)
        .delete(`/api/reviews/${review._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).to.equal(403);
      expect(response.body).to.have.property('error');
    });
  });
}); 