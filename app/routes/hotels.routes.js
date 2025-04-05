/**
 * Hotel Routes
 */
const express = require('express');
const router = express.Router();
const hotelsController = require('../controllers/hotels.controller');
const auth = require('../middleware/auth.middleware');

// GET /api/hotels - Get all hotels
router.get('/', hotelsController.getHotels);

// GET /api/hotels/search - Search hotels
router.get('/search', hotelsController.searchHotels);

// GET /api/hotels/featured - Get featured hotels
router.get('/featured', hotelsController.getFeaturedHotels);

// GET /api/hotels/nearby - Get nearby hotels
router.get('/nearby', hotelsController.getNearbyHotels);

// GET /api/hotels/:id - Get hotel details
router.get('/:id', hotelsController.getHotelDetails);

// GET /api/hotels/:id/rooms - Get hotel rooms
router.get('/:id/rooms', hotelsController.getHotelRooms);

// POST /api/hotels/:id/availability - Check room availability
router.post('/:id/availability', hotelsController.checkAvailability);

module.exports = router; 