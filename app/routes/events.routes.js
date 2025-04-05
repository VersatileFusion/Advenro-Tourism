/**
 * Events Routes
 * Routes for events functionality
 */
const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/events.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @route GET /api/events
 * @desc Get all events with filtering and pagination
 * @access Public
 */
router.get('/', (req, res) => {
  try {
    const result = eventsController.getEvents(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route GET /api/events/:id
 * @desc Get event details by ID
 * @access Public
 */
router.get('/:id', (req, res) => {
  try {
    const result = eventsController.getEventById(req.params.id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route GET /api/events/featured
 * @desc Get featured events
 * @access Public
 */
router.get('/featured', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const result = eventsController.getFeaturedEvents(limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route GET /api/events/upcoming
 * @desc Get upcoming events
 * @access Public
 */
router.get('/upcoming', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const result = eventsController.getUpcomingEvents(limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route GET /api/events/categories
 * @desc Get event categories
 * @access Public
 */
router.get('/categories', (req, res) => {
  try {
    const result = eventsController.getEventCategories();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route POST /api/events/book
 * @desc Book event tickets
 * @access Private
 */
router.post('/book', authenticate, (req, res) => {
  try {
    const bookingData = {
      ...req.body,
      userId: req.user.id
    };
    const result = eventsController.bookEvent(bookingData);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route GET /api/events/bookings
 * @desc Get user's event bookings
 * @access Private
 */
router.get('/bookings', authenticate, (req, res) => {
  try {
    const result = eventsController.getUserBookings(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route POST /api/events/bookings/:id/cancel
 * @desc Cancel event booking
 * @access Private
 */
router.post('/bookings/:id/cancel', authenticate, (req, res) => {
  try {
    const result = eventsController.cancelBooking(req.params.id, req.user.id);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 