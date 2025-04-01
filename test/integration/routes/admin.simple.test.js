const { expect } = require('chai');
const sinon = require('sinon');
const express = require('express');
const supertest = require('supertest');

describe('Admin Dashboard Integration Tests (Simple)', function() {
  let app, request, adminToken, userToken;
  
  before(async function() {
    // Create Express app for testing
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    const authMiddleware = (req, res, next) => {
      if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }
      
      const token = req.headers.authorization.split(' ')[1];
      
      if (token === 'admin-token') {
        req.user = { userId: 'admin123', role: 'admin' };
      } else if (token === 'user-token') {
        req.user = { userId: 'user456', role: 'user' };
      } else {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      next();
    };
    
    // Mock admin middleware
    const adminMiddleware = (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
      }
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin role required.' });
      }
      
      next();
    };
    
    // Mock database models
    const userStats = {
      totalUsers: 150,
      newUsersToday: 8,
      activeUsersWeekly: 97,
      verifiedUsers: 143
    };
    
    const bookingStats = {
      totalBookings: 320,
      upcomingBookings: 42,
      completedBookings: 256,
      cancelledBookings: 22,
      revenue: {
        total: 128000,
        monthly: 14500,
        weekly: 3200
      }
    };
    
    const popularDestinations = [
      { _id: 'dest1', name: 'Paris', country: 'France', bookingCount: 45 },
      { _id: 'dest2', name: 'Rome', country: 'Italy', bookingCount: 38 },
      { _id: 'dest3', name: 'Barcelona', country: 'Spain', bookingCount: 32 }
    ];
    
    const popularHotels = [
      { _id: 'hotel1', name: 'Luxury Palace', location: 'Paris', bookingCount: 22, rating: 4.8 },
      { _id: 'hotel2', name: 'Ocean View', location: 'Barcelona', bookingCount: 19, rating: 4.6 },
      { _id: 'hotel3', name: 'Mountain Retreat', location: 'Alps', bookingCount: 17, rating: 4.7 }
    ];
    
    const recentBookings = [
      { _id: 'booking1', user: { name: 'John Doe' }, hotel: { name: 'Luxury Palace' }, checkInDate: new Date('2023-12-15'), status: 'confirmed', totalPrice: 850 },
      { _id: 'booking2', user: { name: 'Jane Smith' }, hotel: { name: 'Ocean View' }, checkInDate: new Date('2023-12-18'), status: 'confirmed', totalPrice: 720 },
      { _id: 'booking3', user: { name: 'Bob Johnson' }, hotel: { name: 'City Center Hotel' }, checkInDate: new Date('2023-12-10'), status: 'cancelled', totalPrice: 450 }
    ];
    
    // Dashboard route handler
    app.get('/api/admin/dashboard', authMiddleware, adminMiddleware, (req, res) => {
      res.json({
        userStats,
        bookingStats,
        popularDestinations,
        popularHotels,
        recentBookings
      });
    });
    
    // User management route handlers
    app.get('/api/admin/users', authMiddleware, adminMiddleware, (req, res) => {
      const users = [
        { _id: 'user1', name: 'John Doe', email: 'john@example.com', role: 'user', isVerified: true },
        { _id: 'user2', name: 'Jane Smith', email: 'jane@example.com', role: 'user', isVerified: true },
        { _id: 'admin1', name: 'Admin User', email: 'admin@example.com', role: 'admin', isVerified: true }
      ];
      res.json(users);
    });
    
    app.put('/api/admin/users/:id', authMiddleware, adminMiddleware, (req, res) => {
      const { id } = req.params;
      
      // Validate user exists
      if (id !== 'user1' && id !== 'user2' && id !== 'admin1') {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't allow updating own user
      if (id === 'admin1') {
        return res.status(400).json({ message: 'Cannot update your own user through admin route' });
      }
      
      // Return updated user
      const updatedUser = {
        _id: id,
        name: req.body.name || 'Updated User',
        email: req.body.email || 'updated@example.com',
        role: req.body.role || 'user',
        isVerified: req.body.isVerified !== undefined ? req.body.isVerified : true
      };
      
      res.json(updatedUser);
    });
    
    app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, (req, res) => {
      const { id } = req.params;
      
      // Validate user exists
      if (id !== 'user1' && id !== 'user2' && id !== 'admin1') {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't allow deleting own user
      if (id === 'admin1') {
        return res.status(400).json({ message: 'Cannot delete your own account through admin route' });
      }
      
      res.json({ message: 'User deleted successfully' });
    });
    
    // Create supertest client
    request = supertest(app);
    
    // Set tokens for testing
    adminToken = 'admin-token';
    userToken = 'user-token';
  });
  
  describe('Dashboard Access', () => {
    it('should return dashboard data for admin users', async () => {
      const res = await request
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('userStats');
      expect(res.body).to.have.property('bookingStats');
      expect(res.body).to.have.property('popularDestinations');
      expect(res.body).to.have.property('popularHotels');
      expect(res.body).to.have.property('recentBookings');
      
      // Verify specific data
      expect(res.body.userStats).to.have.property('totalUsers', 150);
      expect(res.body.bookingStats.revenue).to.have.property('total', 128000);
      expect(res.body.popularDestinations).to.have.lengthOf(3);
      expect(res.body.popularHotels).to.have.lengthOf(3);
      expect(res.body.recentBookings).to.have.lengthOf(3);
    });
    
    it('should return 403 for non-admin users', async () => {
      const res = await request
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('message', 'Access denied. Admin role required.');
    });
    
    it('should return 401 without authentication', async () => {
      const res = await request.get('/api/admin/dashboard');
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message', 'No token provided');
    });
  });
  
  describe('User Management', () => {
    it('should get all users for admin', async () => {
      const res = await request
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body).to.have.lengthOf(3);
      expect(res.body[0]).to.have.property('name');
      expect(res.body[0]).to.have.property('email');
      expect(res.body[0]).to.have.property('role');
    });
    
    it('should update a user', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
        role: 'admin',
        isVerified: false
      };
      
      const res = await request
        .put('/api/admin/users/user1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('_id', 'user1');
      expect(res.body).to.have.property('name', 'Updated Name');
      expect(res.body).to.have.property('email', 'updated@example.com');
      expect(res.body).to.have.property('role', 'admin');
      expect(res.body).to.have.property('isVerified', false);
    });
    
    it('should not allow updating own user', async () => {
      const res = await request
        .put('/api/admin/users/admin1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'user' });
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message', 'Cannot update your own user through admin route');
    });
    
    it('should delete a user', async () => {
      const res = await request
        .delete('/api/admin/users/user2')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message', 'User deleted successfully');
    });
    
    it('should not allow deleting own user', async () => {
      const res = await request
        .delete('/api/admin/users/admin1')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message', 'Cannot delete your own account through admin route');
    });
    
    it('should return 403 for non-admin users trying to access user management', async () => {
      const res = await request
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('message', 'Access denied. Admin role required.');
    });
  });
}); 