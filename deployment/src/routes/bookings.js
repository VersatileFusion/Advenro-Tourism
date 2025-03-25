const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { schemas } = require('../middleware/validate');
const {
    getAllBookings,
    getUserBookings,
    getHotelBookings,
    getBookingById,
    createBooking,
    updateBooking,
    cancelBooking,
    completeBooking,
    updateBookingStatus,
    getBookingStats,
    processPayment,
    verifyPayment,
    refundPayment
} = require('../controllers/booking.controller');

// Admin routes
router.get('/admin/all', authenticate, authorize('admin'), getAllBookings);
router.get('/admin/stats', authenticate, authorize('admin'), getBookingStats);
router.put('/admin/:id', authenticate, authorize('admin'), validate(schemas.updateBooking), updateBooking);

// Hotel owner routes
router.get('/hotel/:hotelId', authenticate, authorize('hotel_owner'), getHotelBookings);
router.put('/:id/status', authenticate, authorize('hotel_owner'), validate(schemas.updateBookingStatus), updateBookingStatus);

// User routes
router.get('/my-bookings', authenticate, getUserBookings);
router.post('/', authenticate, validate(schemas.createBooking), createBooking);

// Payment routes
router.post('/:id/payment', authenticate, processPayment);
router.get('/:id/payment/verify', authenticate, verifyPayment);
router.post('/:id/payment/refund', authenticate, refundPayment);

// Individual booking routes
router.get('/:id', authenticate, getBookingById);
router.put('/:id/cancel', authenticate, cancelBooking);
router.put('/:id/complete', authenticate, completeBooking);

module.exports = router; 