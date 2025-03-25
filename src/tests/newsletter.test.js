const request = require('supertest');
const { expect } = require('chai');
const { app, connectDB, clearDatabase, createTestUser, generateTestToken } = require('./test-helper');
const { Newsletter } = require('../models/Newsletter');
const { Subscription } = require('../models/Subscription');

describe('Newsletter Routes', () => {
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

  describe('POST /api/newsletter/subscribe', () => {
    it('should subscribe to newsletter with valid email', async () => {
      const response = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ email: 'test@example.com' });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('message');
    });

    it('should not subscribe with invalid email format', async () => {
      const response = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ email: 'invalid-email' });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error');
    });

    it('should not subscribe with missing email', async () => {
      const response = await request(app)
        .post('/api/newsletter/subscribe')
        .send({});

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error');
    });
  });

  describe('POST /api/newsletter/unsubscribe', () => {
    it('should unsubscribe from newsletter', async () => {
      await Subscription.create({ email: 'test@example.com' });

      const response = await request(app)
        .post('/api/newsletter/unsubscribe')
        .send({ email: 'test@example.com' });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('message');
    });

    it('should handle unsubscribe with non-existent email', async () => {
      const response = await request(app)
        .post('/api/newsletter/unsubscribe')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error');
    });
  });

  describe('GET /api/newsletter/subscribers', () => {
    it('should get all subscribers when admin', async () => {
      await Subscription.create({ email: 'subscriber1@example.com' });
      await Subscription.create({ email: 'subscriber2@example.com' });

      const response = await request(app)
        .get('/api/newsletter/subscribers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
    });

    it('should not allow regular users to get subscribers', async () => {
      const response = await request(app)
        .get('/api/newsletter/subscribers')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).to.equal(403);
      expect(response.body).to.have.property('error');
    });

    it('should not allow unauthenticated access', async () => {
      const response = await request(app)
        .get('/api/newsletter/subscribers');

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('error');
    });
  });

  describe('POST /api/newsletter/send', () => {
    it('should send newsletter when admin', async () => {
      const newsletterData = {
        subject: 'Test Newsletter',
        content: 'This is a test newsletter',
        recipients: ['test@example.com']
      };

      const response = await request(app)
        .post('/api/newsletter/send')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newsletterData);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('message');
      expect(response.body).to.have.property('newsletterId');
    });

    it('should not allow regular users to send newsletter', async () => {
      const newsletterData = {
        subject: 'Test Newsletter',
        content: 'This is a test newsletter',
        recipients: ['test@example.com']
      };

      const response = await request(app)
        .post('/api/newsletter/send')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newsletterData);

      expect(response.status).to.equal(403);
      expect(response.body).to.have.property('error');
    });

    it('should validate newsletter data', async () => {
      const newsletterData = {
        subject: '',
        content: '',
        recipients: []
      };

      const response = await request(app)
        .post('/api/newsletter/send')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newsletterData);

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error');
    });
  });

  describe('GET /api/newsletter/history', () => {
    it('should get newsletter history when admin', async () => {
      await Newsletter.create({
        subject: 'Test Newsletter 1',
        content: 'Content 1',
        sentAt: new Date()
      });

      await Newsletter.create({
        subject: 'Test Newsletter 2',
        content: 'Content 2',
        sentAt: new Date()
      });

      const response = await request(app)
        .get('/api/newsletter/history')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
    });

    it('should not allow regular users to view history', async () => {
      const response = await request(app)
        .get('/api/newsletter/history')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).to.equal(403);
      expect(response.body).to.have.property('error');
    });
  });

  describe('DELETE /api/newsletter/:id', () => {
    it('should delete newsletter when admin', async () => {
      const newsletter = await Newsletter.create({
        subject: 'Test Newsletter',
        content: 'Test content',
        sentAt: new Date()
      });

      const response = await request(app)
        .delete(`/api/newsletter/${newsletter._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('message');

      // Verify newsletter is deleted
      const getResponse = await request(app)
        .get(`/api/newsletter/${newsletter._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(getResponse.status).to.equal(404);
    });

    it('should not allow regular users to delete newsletter', async () => {
      const newsletter = await Newsletter.create({
        subject: 'Test Newsletter',
        content: 'Test content',
        sentAt: new Date()
      });

      const response = await request(app)
        .delete(`/api/newsletter/${newsletter._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).to.equal(403);
      expect(response.body).to.have.property('error');
    });
  });
}); 