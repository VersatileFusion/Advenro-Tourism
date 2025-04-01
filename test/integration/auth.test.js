const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const app = require('../../src/server/app');
const mongoose = require('mongoose');

describe('Authentication API', () => {
  // Create a unique email for each test run
  const testEmail = `test${Date.now()}@example.com`;
  let authToken;

  before(async () => {
    // Connect to the test database if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/advenro-test', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('Connected to MongoDB for testing');
    }
  });

  after(async () => {
    // Clean up the test database
    if (mongoose.connection.readyState === 1) {
      // Delete test users
      await mongoose.connection.collections.users.deleteMany({ email: testEmail });
      console.log('Test data cleaned up');
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'Password123!',
          name: 'Test User',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('token');
      expect(res.body.user).to.have.property('id');
      expect(res.body.user.email).to.equal(testEmail);
      
      // Save token for future tests
      authToken = res.body.token;
    });

    it('should not register a user with an existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'Password123!',
          name: 'Test User',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message');
      expect(res.body.message).to.equal('User already exists');
    });

    it('should not register a user with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          name: 'Test User',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(res.status).to.equal(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login a registered user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'Password123!'
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
      expect(res.body.user).to.have.property('id');
      expect(res.body.user.email).to.equal(testEmail);
    });

    it('should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword!'
        });

      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message');
      expect(res.body.message).to.include('Invalid credentials');
    });

    it('should not login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!'
        });

      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message');
      expect(res.body.message).to.include('Invalid credentials');
    });
  });
}); 