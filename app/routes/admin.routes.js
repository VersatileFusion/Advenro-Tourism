/**
 * Admin Routes
 * Routes for the admin dashboard API
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Authentication middleware for admin routes
const adminAuthMiddleware = (req, res, next) => {
  // Check if user is authenticated
  authMiddleware(req, res, () => {
    // Check if user is an admin
    if (req.user && (req.user.role === 'admin' || req.user.role === 'moderator')) {
      next();
    } else {
      res.status(403).json({ error: 'You do not have permission to access this resource' });
    }
  });
};

// Dashboard statistics
router.get('/dashboard/stats', adminController.getDashboardStats);

// Recent activity
router.get('/activity', adminController.getRecentActivity);

// Listings statistics
router.get('/listings/stats', adminController.getListingsStats);

// Support tickets statistics
router.get('/support/stats', adminController.getSupportTicketsStats);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);

// Booking management
router.get('/bookings', adminController.getBookings);
router.get('/bookings/:id', adminController.getBookingById);
router.put('/bookings/:id/status', adminController.updateBookingStatus);

// System settings
router.get('/settings', adminController.getSystemSettings);
router.put('/settings', adminController.updateSystemSettings);

module.exports = router; 