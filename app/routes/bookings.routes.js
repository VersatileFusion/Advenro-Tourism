/**
 * Booking Routes
 */
const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookings.controller');
const { authenticate } = require('../middleware/auth.middleware');

// GET /api/bookings - Get all bookings for the current user
router.get('/', authenticate, bookingsController.getBookings);

// GET /api/bookings/:id - Get booking details by ID
router.get('/:id', authenticate, bookingsController.getBookingDetails);

// POST /api/bookings - Create a new booking
router.post('/', authenticate, bookingsController.createBooking);

// PUT /api/bookings/:id - Update booking details
router.put('/:id', authenticate, bookingsController.updateBooking);

// POST /api/bookings/:id/cancel - Cancel a booking
router.post('/:id/cancel', authenticate, bookingsController.cancelBooking);

// POST /api/bookings/:id/modify - Modify a booking
router.post('/:id/modify', authenticate, bookingsController.modifyBooking);

module.exports = router; 