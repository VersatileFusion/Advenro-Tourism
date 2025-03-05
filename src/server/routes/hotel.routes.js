const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotel.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { schemas } = require('../middleware/validate');
const upload = require('../middleware/upload');

// Public routes
router.get('/', hotelController.getAllHotels);
router.get('/search', hotelController.searchHotels);
router.get('/:id', hotelController.getHotelById);
router.get('/:id/rooms', hotelController.getHotelRooms);
router.get('/:id/reviews', hotelController.getHotelReviews);

// Protected routes (require authentication)
router.post('/:id/favorite', authenticate, hotelController.toggleFavorite);
router.post('/:id/review', authenticate, validate(schemas.review), hotelController.createReview);

// Hotel owner routes (require authentication and owner role)
router.post('/', authenticate, authorize('hotel_owner'), validate(schemas.createHotel), upload.array('images', 10), hotelController.createHotel);
router.put('/:id', authenticate, authorize('hotel_owner'), validate(schemas.updateHotel), upload.array('images', 10), hotelController.updateHotel);
router.delete('/:id', authenticate, authorize('hotel_owner'), hotelController.deleteHotel);

// Room management routes
router.post('/:id/rooms', authenticate, authorize('hotel_owner'), validate(schemas.createRoom), upload.array('images', 5), hotelController.createRoom);
router.put('/:id/rooms/:roomId', authenticate, authorize('hotel_owner'), validate(schemas.updateRoom), upload.array('images', 5), hotelController.updateRoom);
router.delete('/:id/rooms/:roomId', authenticate, authorize('hotel_owner'), hotelController.deleteRoom);

// Availability routes
router.get('/:id/availability', hotelController.checkAvailability);
router.get('/:id/rooms/:roomId/availability', hotelController.checkRoomAvailability);

// Admin routes (require authentication and admin role)
router.get('/admin/pending', authenticate, authorize('admin'), hotelController.getPendingHotels);
router.put('/admin/:id/approve', authenticate, authorize('admin'), hotelController.approveHotel);
router.put('/admin/:id/reject', authenticate, authorize('admin'), hotelController.rejectHotel);

module.exports = router; 