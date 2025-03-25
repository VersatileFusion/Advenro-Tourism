const request = require('supertest');
const { expect } = require('chai');
const { app, connectDB, clearDatabase, createTestUser, generateTestToken } = require('./test-helper');
const { Destination } = require('../models/Destination');

describe('Destination Routes', () => {
  let user, adminUser, userToken, adminToken;

  before(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    user = await createTestUser('user');
    adminUser = await createTestUser('admin');
    userToken = generateTestToken(user);
    adminToken = generateTestToken(adminUser);
  });

  describe('GET /api/destinations', () => {
    it('should get all destinations', async () => {
      await Destination.create([
        { name: 'Paris', country: 'France', region: 'Europe' },
        { name: 'Tokyo', country: 'Japan', region: 'Asia' }
      ]);

      const response = await request(app)
        .get('/api/destinations');

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
    });

    it('should filter destinations by region', async () => {
      await Destination.create([
        { name: 'Paris', country: 'France', region: 'Europe' },
        { name: 'Tokyo', country: 'Japan', region: 'Asia' }
      ]);

      const response = await request(app)
        .get('/api/destinations?region=Europe');

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body.every(dest => dest.region === 'Europe')).to.be.true;
    });

    it('should filter destinations by country', async () => {
      await Destination.create([
        { name: 'Paris', country: 'France', region: 'Europe' },
        { name: 'Nice', country: 'France', region: 'Europe' },
        { name: 'Tokyo', country: 'Japan', region: 'Asia' }
      ]);

      const response = await request(app)
        .get('/api/destinations?country=France');

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body.every(dest => dest.country === 'France')).to.be.true;
    });
  });

  describe('GET /api/destinations/:id', () => {
    it('should get destination by id', async () => {
      const destination = await Destination.create({
        name: 'Paris',
        country: 'France',
        region: 'Europe'
      });

      const response = await request(app)
        .get(`/api/destinations/${destination._id}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('_id', destination._id.toString());
    });

    it('should return 404 for non-existent destination', async () => {
      const response = await request(app)
        .get('/api/destinations/123456789012345678901234');

      expect(response.status).to.equal(404);
      expect(response.body).to.have.property('error');
    });
  });

  describe('POST /api/destinations', () => {
    it('should create new destination when admin', async () => {
      const destinationData = {
        name: 'Paris',
        country: 'France',
        region: 'Europe',
        description: 'City of Light',
        attractions: ['Eiffel Tower', 'Louvre'],
        images: ['paris1.jpg', 'paris2.jpg'],
        climate: 'Temperate',
        bestTimeToVisit: 'Spring',
        travelTips: ['Learn basic French', 'Book in advance']
      };

      const response = await request(app)
        .post('/api/destinations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(destinationData);

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('_id');
      expect(response.body.name).to.equal(destinationData.name);
    });

    it('should not allow regular users to create destinations', async () => {
      const destinationData = {
        name: 'Paris',
        country: 'France',
        region: 'Europe'
      };

      const response = await request(app)
        .post('/api/destinations')
        .set('Authorization', `Bearer ${userToken}`)
        .send(destinationData);

      expect(response.status).to.equal(403);
      expect(response.body).to.have.property('error');
    });

    it('should validate required fields', async () => {
      const destinationData = {
        name: 'Paris'
      };

      const response = await request(app)
        .post('/api/destinations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(destinationData);

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error');
    });
  });

  describe('PUT /api/destinations/:id', () => {
    it('should update destination when admin', async () => {
      const destination = await Destination.create({
        name: 'Paris',
        country: 'France',
        region: 'Europe',
        description: 'Old description'
      });

      const updateData = {
        description: 'Updated description',
        attractions: ['New Attraction 1', 'New Attraction 2']
      };

      const response = await request(app)
        .put(`/api/destinations/${destination._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).to.equal(200);
      expect(response.body.description).to.equal(updateData.description);
      expect(response.body.attractions).to.deep.equal(updateData.attractions);
    });

    it('should not allow regular users to update destinations', async () => {
      const destination = await Destination.create({
        name: 'Paris',
        country: 'France',
        region: 'Europe'
      });

      const updateData = {
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/destinations/${destination._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).to.equal(403);
      expect(response.body).to.have.property('error');
    });

    it('should return 404 for non-existent destination', async () => {
      const updateData = {
        description: 'Updated description'
      };

      const response = await request(app)
        .put('/api/destinations/123456789012345678901234')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).to.equal(404);
      expect(response.body).to.have.property('error');
    });
  });

  describe('DELETE /api/destinations/:id', () => {
    it('should delete destination when admin', async () => {
      const destination = await Destination.create({
        name: 'Paris',
        country: 'France',
        region: 'Europe'
      });

      const response = await request(app)
        .delete(`/api/destinations/${destination._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('message');

      // Verify destination is deleted
      const getResponse = await request(app)
        .get(`/api/destinations/${destination._id}`);
      expect(getResponse.status).to.equal(404);
    });

    it('should not allow regular users to delete destinations', async () => {
      const destination = await Destination.create({
        name: 'Paris',
        country: 'France',
        region: 'Europe'
      });

      const response = await request(app)
        .delete(`/api/destinations/${destination._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).to.equal(403);
      expect(response.body).to.have.property('error');
    });
  });

  describe('GET /api/destinations/search', () => {
    it('should search destinations by name', async () => {
      await Destination.create([
        { name: 'Paris', country: 'France', region: 'Europe' },
        { name: 'Tokyo', country: 'Japan', region: 'Asia' }
      ]);

      const response = await request(app)
        .get('/api/destinations/search?query=Paris');

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
    });

    it('should search destinations by country', async () => {
      await Destination.create([
        { name: 'Paris', country: 'France', region: 'Europe' },
        { name: 'Nice', country: 'France', region: 'Europe' },
        { name: 'Tokyo', country: 'Japan', region: 'Asia' }
      ]);

      const response = await request(app)
        .get('/api/destinations/search?query=France');

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body.every(dest => dest.country === 'France')).to.be.true;
    });
  });
}); 