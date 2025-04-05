/**
 * Tours Routes
 * Defines API routes for tour-related operations
 */

const express = require('express');
const toursController = require('../controllers/tours.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', toursController.getTours);
router.get('/details/:id', toursController.getTourDetails);
router.get('/categories', toursController.getCategories);
router.get('/search', toursController.searchTours);
router.get('/popular', toursController.getPopularTours);

// Protected routes - require authentication
router.post('/book', authenticate, toursController.bookTour);
router.get('/bookings', authenticate, toursController.getUserBookings);
router.get('/bookings/:id', authenticate, toursController.getBookingDetails);
router.patch('/bookings/:id/cancel', authenticate, toursController.cancelBooking);

module.exports = router; 