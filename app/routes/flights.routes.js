/**
 * Flights Routes
 */
const express = require('express');
const router = express.Router();
const flightsController = require('../controllers/flights.controller');
const { authenticate } = require('../middleware/auth.middleware');

// GET /api/flights/search - Search flights
router.get('/search', flightsController.searchFlights);

// GET /api/flights/airports - Get airports
router.get('/airports', flightsController.getAirports);

// GET /api/flights/airlines - Get airlines
router.get('/airlines', flightsController.getAirlines);

// GET /api/flights/:id - Get flight details
router.get('/:id', flightsController.getFlightDetails);

// POST /api/flights/booking - Book a flight
router.post('/booking', authenticate, flightsController.bookFlight);

// GET /api/flights/booking/user - Get user flight bookings
router.get('/booking/user', authenticate, flightsController.getUserBookings);

// GET /api/flights/booking/:id - Get booking details
router.get('/booking/:id', authenticate, flightsController.getBookingDetails);

// PUT /api/flights/booking/:id/cancel - Cancel booking
router.put('/booking/:id/cancel', authenticate, flightsController.cancelBooking);

module.exports = router;