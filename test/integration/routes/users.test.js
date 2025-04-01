const chai = require('chai');
const expect = chai.expect;
const { getRequest, postRequest, putRequest } = require('../../helpers/request-helper');
const { createUserWithToken } = require('../../helpers/auth-helper');
const mongoose = require('mongoose');

// Load test setup
require('../../config/setup');

describe('Users Routes', function() {
  this.timeout(10000);
  
  let userToken;
  let userId;
  
  // Create a unique email for testing
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  
  // Connect to the test database before running tests
  before(async function() {
    // Create user with token
    const user = await createUserWithToken();
    userToken = user.token;
    userId = user.user._id.toString();
  });
  
  // Clean up after tests
  after(async function() {
    // Any cleanup needed
  });
  
  describe('POST /api/users/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: testEmail,
        password: testPassword,
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User'
      };
      
      const res = await postRequest('/api/users/register', userData);
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('token');
      expect(res.body).to.have.property('user');
      expect(res.body.user).to.have.property('id');
      expect(res.body.user.email).to.equal(testEmail);
      expect(res.body.user.name).to.equal('Test User');
      // Should not expose password
      expect(res.body.user).to.not.have.property('password');
    });
    
    it('should not register user with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: testPassword,
        name: 'Invalid Email Test'
      };
      
      const res = await postRequest('/api/users/register', userData);
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('errors');
    });
    
    it('should not register user with short password', async () => {
      const userData = {
        email: 'short-password@example.com',
        password: '12345', // Less than 6 chars
        name: 'Short Password Test'
      };
      
      const res = await postRequest('/api/users/register', userData);
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('errors');
    });
  });
  
  describe('POST /api/users/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: testEmail,
        password: testPassword
      };
      
      const res = await postRequest('/api/users/login', loginData);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
      expect(res.body).to.have.property('user');
      expect(res.body.user.email).to.equal(testEmail);
    });
    
    it('should not login with incorrect password', async () => {
      const loginData = {
        email: testEmail,
        password: 'WrongPassword123!'
      };
      
      const res = await postRequest('/api/users/login', loginData);
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message');
    });
    
    it('should not login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'SomePassword123!'
      };
      
      const res = await postRequest('/api/users/login', loginData);
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message');
    });
  });
  
  describe('GET /api/users/profile', () => {
    it('should get user profile when authenticated', async () => {
      const res = await getRequest('/api/users/profile', userToken);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('_id');
      expect(res.body).to.have.property('email');
      expect(res.body).to.have.property('name');
      // Should not expose password
      expect(res.body).to.not.have.property('password');
    });
    
    it('should not get profile without authentication', async () => {
      const res = await getRequest('/api/users/profile');
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message');
    });
  });
  
  describe('PUT /api/users/profile', () => {
    it('should update user profile when authenticated', async () => {
      const updateData = {
        name: 'Updated User Name',
        bio: 'This is an updated bio for testing'
      };
      
      const res = await putRequest('/api/users/profile', updateData, userToken);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('_id');
      expect(res.body.name).to.equal(updateData.name);
      expect(res.body.bio).to.equal(updateData.bio);
    });
    
    it('should not update profile without authentication', async () => {
      const updateData = {
        name: 'Unauthorized Update'
      };
      
      const res = await putRequest('/api/users/profile', updateData);
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message');
    });
  });
  
  describe('POST /api/users/newsletter/subscribe', () => {
    it('should subscribe to newsletter', async () => {
      const subscribeData = {
        email: 'newsletter@example.com'
      };
      
      const res = await postRequest('/api/users/newsletter/subscribe', subscribeData);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message');
      expect(res.body.message).to.include('subscribed');
    });
    
    it('should not subscribe with invalid email', async () => {
      const subscribeData = {
        email: 'invalid-email'
      };
      
      const res = await postRequest('/api/users/newsletter/subscribe', subscribeData);
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message');
    });
  });
}); 