const request = require('supertest');
const { expect } = require('chai');
const app = require('../app');
const { setupTestDB, teardownTestDB, clearCollections } = require('./setup');
const { createTestUser, generateAuthToken } = require('./helpers');

describe('Contact API', () => {
  let testUser;
  let authToken;

  before(async () => {
    await setupTestDB();
    testUser = await createTestUser();
    authToken = generateAuthToken(testUser);
  });

  after(async () => {
    await clearCollections();
    await teardownTestDB();
  });

  describe('POST /api/contact', () => {
    it('should send a contact message', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Test Subject',
          message: 'Test Message'
        });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('message', 'Message sent successfully');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send({
          name: 'John Doe'
        });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send({
          name: 'John Doe',
          email: 'invalid-email',
          subject: 'Test Subject',
          message: 'Test Message'
        });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error');
    });
  });

  describe('GET /api/contact/messages', () => {
    it('should get all contact messages for admin', async () => {
      const response = await request(app)
        .get('/api/contact/messages')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
    });

    it('should require admin access', async () => {
      const regularUser = await createTestUser({ role: 'user' });
      const regularUserToken = generateAuthToken(regularUser);

      const response = await request(app)
        .get('/api/contact/messages')
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(response.status).to.equal(403);
      expect(response.body).to.have.property('error');
    });
  });

  describe('DELETE /api/contact/messages/:id', () => {
    it('should delete a contact message for admin', async () => {
      // First create a message
      const createResponse = await request(app)
        .post('/api/contact')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          subject: 'Test Subject',
          message: 'Test Message'
        });

      expect(createResponse.status).to.equal(200);

      // Get the message ID
      const messagesResponse = await request(app)
        .get('/api/contact/messages')
        .set('Authorization', `Bearer ${authToken}`);

      expect(messagesResponse.status).to.equal(200);
      const messageId = messagesResponse.body[0]._id;

      // Delete the message
      const response = await request(app)
        .delete(`/api/contact/messages/${messageId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('message', 'Message deleted successfully');
    });

    it('should handle non-existent message ID', async () => {
      const response = await request(app)
        .delete('/api/contact/messages/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(404);
      expect(response.body).to.have.property('error');
    });

    it('should require admin access for deletion', async () => {
      const regularUser = await createTestUser({ role: 'user' });
      const regularUserToken = generateAuthToken(regularUser);

      const response = await request(app)
        .delete('/api/contact/messages/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(response.status).to.equal(403);
      expect(response.body).to.have.property('error');
    });
  });
}); 