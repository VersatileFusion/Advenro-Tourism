const request = require('supertest');
const { app, connectDB, clearDatabase, createTestUser, createTestAdmin, createTestHotel, createTestBooking, generateTestToken } = require('./test-helper');

describe('Booking Routes', () => {
  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /api/bookings', () => {
    it('should create new booking', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user);
      const hotel = await createTestHotel();
      const bookingData = {
        hotel: hotel._id,
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 86400000),
        guests: 2,
        totalPrice: 200
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('hotel', hotel._id.toString());
      expect(response.body).toHaveProperty('user', user._id.toString());
      expect(response.body).toHaveProperty('status', 'pending');
    });

    it('should not create booking without authentication', async () => {
      const hotel = await createTestHotel();
      const bookingData = {
        hotel: hotel._id,
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 86400000),
        guests: 2,
        totalPrice: 200
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/bookings', () => {
    it('should get user bookings', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user);
      const booking1 = await createTestBooking({ user: user._id });
      const booking2 = await createTestBooking({ user: user._id });

      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('user', user._id.toString());
      expect(response.body[1]).toHaveProperty('user', user._id.toString());
    });

    it('should get all bookings (admin only)', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      await createTestBooking({ user: user1._id });
      await createTestBooking({ user: user2._id });

      const response = await request(app)
        .get('/api/bookings/admin/all')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('should not get all bookings without admin privileges', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user);

      const response = await request(app)
        .get('/api/bookings/admin/all')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/bookings/:id', () => {
    it('should get booking by id', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user);
      const booking = await createTestBooking({ user: user._id });

      const response = await request(app)
        .get(`/api/bookings/${booking._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id', booking._id.toString());
    });

    it('should not get booking of another user', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const token = generateTestToken(user1);
      const booking = await createTestBooking({ user: user2._id });

      const response = await request(app)
        .get(`/api/bookings/${booking._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/bookings/:id/status', () => {
    it('should update booking status (admin only)', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const booking = await createTestBooking();
      const statusData = {
        status: 'confirmed'
      };

      const response = await request(app)
        .put(`/api/bookings/${booking._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send(statusData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', statusData.status);
    });

    it('should not update booking status without admin privileges', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user);
      const booking = await createTestBooking();
      const statusData = {
        status: 'confirmed'
      };

      const response = await request(app)
        .put(`/api/bookings/${booking._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send(statusData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/bookings/:id', () => {
    it('should cancel booking', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user);
      const booking = await createTestBooking({ user: user._id });

      const response = await request(app)
        .delete(`/api/bookings/${booking._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      // Verify booking is cancelled
      const getResponse = await request(app)
        .get(`/api/bookings/${booking._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body).toHaveProperty('status', 'cancelled');
    });

    it('should not cancel booking of another user', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const token = generateTestToken(user1);
      const booking = await createTestBooking({ user: user2._id });

      const response = await request(app)
        .delete(`/api/bookings/${booking._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 