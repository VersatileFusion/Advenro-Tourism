const chai = require('chai');
const expect = chai.expect;
const { postRequest } = require('../../helpers/request-helper');
const { createUser } = require('../../helpers/auth-helper');

// Load test setup
require('../../config/setup');

describe('Auth Routes', function() {
  this.timeout(10000);
  
  // Create a unique email for testing
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: testEmail,
        password: testPassword,
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User'
      };
      
      const res = await postRequest('/api/auth/register', userData);
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('token');
      expect(res.body).to.have.property('user');
      expect(res.body.user).to.have.property('id');
      expect(res.body.user.email).to.equal(testEmail);
      expect(res.body.user.name).to.equal('Test User');
      expect(res.body.user.firstName).to.equal('Test');
      expect(res.body.user.lastName).to.equal('User');
      // Should not expose password
      expect(res.body.user).to.not.have.property('password');
    });
    
    it('should not register user with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: testPassword,
        name: 'Invalid Email Test',
        firstName: 'Invalid',
        lastName: 'Email'
      };
      
      const res = await postRequest('/api/auth/register', userData);
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message');
    });
    
    it('should not register user with existing email', async () => {
      // First ensure we have a user with a known email address
      const duplicateEmail = 'duplicate-test@example.com';
      
      // Create the first user
      await createUser({
        email: duplicateEmail,
        password: 'Password123!',
        name: 'Original User',
        firstName: 'Original',
        lastName: 'User'
      });
      
      // Try to register another user with the same email
      const userData = {
        email: duplicateEmail,
        password: testPassword,
        name: 'Duplicate Email',
        firstName: 'Duplicate',
        lastName: 'Email'
      };
      
      const res = await postRequest('/api/auth/register', userData);
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message');
      expect(res.body.message).to.include('already registered');
    });
  });
  
  describe('POST /api/auth/login', () => {
    // Create a user before testing login
    before(async () => {
      await createUser({
        email: 'login-test@example.com',
        password: 'LoginPassword123!',
        name: 'Login Test',
        firstName: 'Login',
        lastName: 'Test'
      });
    });
    
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'login-test@example.com',
        password: 'LoginPassword123!'
      };
      
      const res = await postRequest('/api/auth/login', loginData);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
      expect(res.body).to.have.property('user');
      expect(res.body.user.email).to.equal(loginData.email);
    });
    
    it('should not login with incorrect password', async () => {
      const loginData = {
        email: 'login-test@example.com',
        password: 'WrongPassword123!'
      };
      
      const res = await postRequest('/api/auth/login', loginData);
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message');
      expect(res.body.message).to.include('Invalid credentials');
    });
    
    it('should not login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'SomePassword123!'
      };
      
      const res = await postRequest('/api/auth/login', loginData);
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message');
      expect(res.body.message).to.include('Invalid credentials');
    });
  });
  
  describe('POST /api/auth/forgot-password', () => {
    it('should respond with success even if email does not exist (security)', async () => {
      const res = await postRequest('/api/auth/forgot-password', {
        email: 'nonexistent@example.com'
      });
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message');
      // Always return success to prevent email enumeration
      expect(res.body.message).to.include('reset email sent');
    });
  });
}); 