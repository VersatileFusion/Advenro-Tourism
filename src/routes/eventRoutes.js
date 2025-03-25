const express = require('express');
const eventController = require('../controllers/eventController');
const eventBookingController = require('../controllers/eventBookingController');
const authController = require('../controllers/authController');
const { check } = require('express-validator');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/uploads/events'));
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'event-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Public routes
router.get('/', eventController.getAllEvents);
router.get('/upcoming', eventController.getUpcomingEvents);
router.get('/type/:type', eventController.getEventsByType);
router.get('/:id', eventController.getEvent);
router.get('/:id/tickets', eventController.getEventTickets);

// Protected routes (require authentication)
router.use(authController.protect);

// Event booking routes
router.post('/booking', [
  check('event').isMongoId().withMessage('Valid event ID is required'),
  check('tickets').isArray().withMessage('Tickets must be an array'),
  check('tickets.*.ticket').isMongoId().withMessage('Valid ticket ID is required'),
  check('tickets.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  check('attendees').isArray().withMessage('Attendees must be an array'),
  check('attendees.*.fullName').notEmpty().withMessage('Attendee name is required'),
  check('attendees.*.email').isEmail().withMessage('Valid email is required for each attendee')
], eventBookingController.createBooking);

router.get('/booking/me', eventBookingController.getMyBookings);
router.get('/booking/:id', eventBookingController.getBooking);
router.post('/booking/:id/cancel', eventBookingController.cancelBooking);
router.patch('/booking/:id/attendees', eventBookingController.updateAttendees);

// Admin routes
router.use(authController.restrictTo('admin'));

// Event management routes
router.post('/', [
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ]),
  check('name').notEmpty().withMessage('Event name is required'),
  check('description').notEmpty().withMessage('Description is required'),
  check('startDate').isISO8601().withMessage('Valid start date is required'),
  check('endDate').isISO8601().withMessage('Valid end date is required')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  check('location.address').notEmpty().withMessage('Location address is required'),
  check('type').notEmpty().withMessage('Event type is required')
], eventController.createEvent);

router.patch('/:id', [
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ])
], eventController.updateEvent);

router.delete('/:id', eventController.deleteEvent);

// Ticket management routes
router.post('/:id/tickets', [
  check('name').notEmpty().withMessage('Ticket name is required'),
  check('price').isNumeric().withMessage('Price must be a number'),
  check('availableQuantity').isInt({ min: 0 }).withMessage('Available quantity must be a positive number')
], eventController.addEventTicket);

router.patch('/:id/tickets/:ticketId', eventController.updateEventTicket);
router.delete('/:id/tickets/:ticketId', eventController.removeEventTicket);

// Booking management routes (admin)
router.get('/:eventId/bookings', eventBookingController.getAllBookings);
router.get('/:eventId/bookings/stats', eventBookingController.getBookingStats);
router.patch('/booking/:id/status', [
  check('status').optional().isIn(['pending', 'confirmed', 'canceled']).withMessage('Invalid status value'),
  check('paymentStatus').optional().isIn(['pending', 'paid', 'refunded']).withMessage('Invalid payment status value')
], eventBookingController.updateBookingStatus);

module.exports = router; 