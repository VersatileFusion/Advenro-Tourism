const request = require('supertest');
const { app, connectDB, clearDatabase, createTestUser, createTestAdmin, createTestHotel, createTestBooking, generateTestToken } = require('./test-helper');

describe('Admin Routes', () => {
  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('GET /api/admin/dashboard', () => {
    it('should get dashboard statistics (admin only)', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      
      // Create test data
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const hotel1 = await createTestHotel();
      const hotel2 = await createTestHotel();
      await createTestBooking({ user: user1._id, hotel: hotel1._id });
      await createTestBooking({ user: user2._id, hotel: hotel2._id });

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('totalHotels');
      expect(response.body).toHaveProperty('totalBookings');
      expect(response.body).toHaveProperty('recentBookings');
      expect(response.body).toHaveProperty('revenueStats');
    });

    it('should not get dashboard statistics without admin privileges', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user);

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/admin/users', () => {
    it('should get all users (admin only)', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      await createTestUser();
      await createTestUser();

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3); // Including admin user
    });

    it('should not get users without admin privileges', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user);

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/admin/users/:id/role', () => {
    it('should update user role (admin only)', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser();
      const roleData = {
        role: 'admin'
      };

      const response = await request(app)
        .put(`/api/admin/users/${user._id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send(roleData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('role', roleData.role);
    });

    it('should not update user role without admin privileges', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user);
      const targetUser = await createTestUser();
      const roleData = {
        role: 'admin'
      };

      const response = await request(app)
        .put(`/api/admin/users/${targetUser._id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send(roleData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete user (admin only)', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser();

      const response = await request(app)
        .delete(`/api/admin/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      // Verify user is deleted
      const getResponse = await request(app)
        .get(`/api/admin/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getResponse.status).toBe(404);
    });

    it('should not delete user without admin privileges', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user);
      const targetUser = await createTestUser();

      const response = await request(app)
        .delete(`/api/admin/users/${targetUser._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should get detailed statistics (admin only)', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      
      // Create test data
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const hotel1 = await createTestHotel();
      const hotel2 = await createTestHotel();
      await createTestBooking({ user: user1._id, hotel: hotel1._id });
      await createTestBooking({ user: user2._id, hotel: hotel2._id });

      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('userStats');
      expect(response.body).toHaveProperty('bookingStats');
      expect(response.body).toHaveProperty('revenueStats');
      expect(response.body).toHaveProperty('hotelStats');
    });

    it('should not get detailed statistics without admin privileges', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user);

      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 