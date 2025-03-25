const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { schemas } = require('../middleware/validate');

// User booking routes (require authentication)
router.post('/', authenticate, validate(schemas.createBooking), bookingController.createBooking);
router.get('/my-bookings', authenticate, bookingController.getUserBookings);
router.get('/:id', authenticate, bookingController.getBookingById);
router.post('/:id/cancel', authenticate, bookingController.cancelBooking);
router.post('/:id/complete', authenticate, bookingController.completeBooking);

// Hotel owner routes (require authentication and owner role)
router.get('/hotel/:hotelId', authenticate, authorize('hotel_owner'), bookingController.getHotelBookings);
router.put('/:id/status', authenticate, authorize('hotel_owner'), validate(schemas.updateBookingStatus), bookingController.updateBookingStatus);

// Payment routes
router.post('/:id/payment', authenticate, validate(schemas.processPayment), bookingController.processPayment);
router.post('/:id/payment/verify', authenticate, bookingController.verifyPayment);
router.post('/:id/payment/refund', authenticate, authorize('hotel_owner'), bookingController.refundPayment);

// Admin routes (require authentication and admin role)
router.get('/admin/all', authenticate, authorize('admin'), bookingController.getAllBookings);
router.get('/admin/stats', authenticate, authorize('admin'), bookingController.getBookingStats);
router.put('/admin/:id', authenticate, authorize('admin'), validate(schemas.updateBooking), bookingController.updateBooking);

module.exports = router; 