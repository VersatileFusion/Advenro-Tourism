const request = require('supertest');
const { expect } = require('chai');
const { app, connectDB, clearDatabase, createTestUser, generateTestToken } = require('./test-helper');

describe('Authentication Routes', () => {
  before(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('token');
      expect(response.body.user).to.have.property('name', userData.name);
      expect(response.body.user).to.have.property('email', userData.email);
      expect(response.body.user).to.not.have.property('password');
    });

    it('should not register user with existing email', async () => {
      const existingUser = await createTestUser();
      const userData = {
        name: 'Another User',
        email: existingUser.email,
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const user = await createTestUser();
      const loginData = {
        email: user.email,
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('token');
      expect(response.body.user).to.have.property('email', user.email);
    });

    it('should not login with invalid credentials', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('error');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user profile', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('email', user.email);
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('error');
    });
  });

  describe('PUT /api/auth/update-profile', () => {
    it('should update user profile', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user);
      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put('/api/auth/update-profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('name', updateData.name);
    });

    it('should not update profile without token', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put('/api/auth/update-profile')
        .send(updateData);

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('error');
    });
  });

  describe('PUT /api/auth/update-password', () => {
    it('should update user password', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user);
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/update-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('message');

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'newpassword123'
        });

      expect(loginResponse.status).to.equal(200);
    });

    it('should not update password with wrong current password', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user);
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/update-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData);

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error');
    });
  });
}); 