const request = require('supertest');
const { expect } = require('chai');
const { app, connectDB, clearDatabase, createTestUser, generateTestToken } = require('./test-helper');
const { Hotel } = require('../models/Hotel');

describe('Hotel Routes', () => {
  let adminUser, regularUser, adminToken, userToken;

  before(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    adminUser = await createTestUser('admin');
    regularUser = await createTestUser('user');
    adminToken = generateTestToken(adminUser);
    userToken = generateTestToken(regularUser);
  });

  describe('GET /api/hotels', () => {
    it('should get all hotels', async () => {
      const hotel1 = await Hotel.create({ name: 'Hotel A', location: 'City A', price: 200 });
      const hotel2 = await Hotel.create({ name: 'Hotel B', location: 'City B', price: 300 });

      const response = await request(app)
        .get('/api/hotels');

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body[0]).to.have.property('name', hotel1.name);
      expect(response.body[1]).to.have.property('name', hotel2.name);
    });

    it('should filter hotels by location', async () => {
      await Hotel.create({ name: 'Hotel A', location: 'City A', price: 200 });
      await Hotel.create({ name: 'Hotel B', location: 'City B', price: 300 });

      const response = await request(app)
        .get('/api/hotels?location=City A');

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body[0]).to.have.property('location', 'City A');
    });

    it('should filter hotels by price range', async () => {
      await Hotel.create({ name: 'Hotel A', location: 'City A', price: 200 });
      await Hotel.create({ name: 'Hotel B', location: 'City B', price: 300 });

      const response = await request(app)
        .get('/api/hotels?maxPrice=250');

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body[0]).to.have.property('price', 200);
    });
  });

  describe('GET /api/hotels/:id', () => {
    it('should get hotel by id', async () => {
      const hotel = await Hotel.create({ name: 'Test Hotel', location: 'Test City', price: 200 });

      const response = await request(app)
        .get(`/api/hotels/${hotel._id}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('_id', hotel._id.toString());
    });

    it('should return 404 for non-existent hotel', async () => {
      const response = await request(app)
        .get('/api/hotels/123456789012345678901234');

      expect(response.status).to.equal(404);
      expect(response.body).to.have.property('error');
    });
  });

  describe('POST /api/hotels', () => {
    it('should create a new hotel when admin', async () => {
      const hotelData = {
        name: 'New Hotel',
        location: 'New City',
        price: 250,
        description: 'A lovely hotel',
        amenities: ['WiFi', 'Pool'],
        images: ['image1.jpg', 'image2.jpg']
      };

      const response = await request(app)
        .post('/api/hotels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(hotelData);

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('name', hotelData.name);
      expect(response.body).to.have.property('location', hotelData.location);
    });

    it('should not allow regular users to create hotels', async () => {
      const hotelData = {
        name: 'New Hotel',
        location: 'New City',
        price: 250
      };

      const response = await request(app)
        .post('/api/hotels')
        .set('Authorization', `Bearer ${userToken}`)
        .send(hotelData);

      expect(response.status).to.equal(403);
      expect(response.body).to.have.property('error');
    });
  });

  describe('PUT /api/hotels/:id', () => {
    it('should update hotel when admin', async () => {
      const hotel = await Hotel.create({ name: 'Test Hotel', location: 'Test City', price: 200 });
      const updateData = {
        name: 'Updated Hotel',
        price: 300
      };

      const response = await request(app)
        .put(`/api/hotels/${hotel._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('name', updateData.name);
      expect(response.body).to.have.property('price', updateData.price);
    });

    it('should not allow regular users to update hotels', async () => {
      const hotel = await Hotel.create({ name: 'Test Hotel', location: 'Test City', price: 200 });
      const updateData = {
        name: 'Updated Hotel',
        price: 300
      };

      const response = await request(app)
        .put(`/api/hotels/${hotel._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).to.equal(403);
      expect(response.body).to.have.property('error');
    });
  });

  describe('DELETE /api/hotels/:id', () => {
    it('should delete hotel when admin', async () => {
      const hotel = await Hotel.create({ name: 'Test Hotel', location: 'Test City', price: 200 });

      const response = await request(app)
        .delete(`/api/hotels/${hotel._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('message');

      // Verify hotel is deleted
      const getResponse = await request(app)
        .get(`/api/hotels/${hotel._id}`);
      expect(getResponse.status).to.equal(404);
    });

    it('should not allow regular users to delete hotels', async () => {
      const hotel = await Hotel.create({ name: 'Test Hotel', location: 'Test City', price: 200 });

      const response = await request(app)
        .delete(`/api/hotels/${hotel._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).to.equal(403);
      expect(response.body).to.have.property('error');
    });
  });
}); 