const express = require('express');
const router = express.Router();
const localServiceController = require('../controllers/localServiceController');
const authController = require('../controllers/authController');
const { check } = require('express-validator');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/services');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = file.originalname.split('.').pop();
    cb(null, `service-${uniqueSuffix}.${fileExtension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload only images.'), false);
    }
  }
});

// Validation middleware
const validateService = [
  check('name').not().isEmpty().withMessage('Service name is required'),
  check('description').not().isEmpty().withMessage('Description is required'),
  check('category').isIn(['Transportation', 'Food Delivery', 'Shopping', 'Beauty', 'Fitness', 'Other'])
    .withMessage('Invalid category'),
  check('price.base').isNumeric().withMessage('Price must be a number')
];

// Public routes
router.get('/', localServiceController.getAllServices);
router.get('/nearby', localServiceController.getNearbyServices);
router.get('/category/:category', localServiceController.getServicesByCategory);
router.get('/:id', localServiceController.getService);

// Protected routes (requires authentication)
router.use(authController.protect);

// User bookings
router.get('/bookings/me', localServiceController.getUserBookings);
router.post('/:serviceId/book', localServiceController.bookService);
router.patch('/bookings/:bookingId/cancel', localServiceController.cancelBooking);

// Admin only routes
router.use(authController.restrictTo('admin'));

router.post(
  '/',
  upload.single('image'),
  validateService,
  localServiceController.createService
);

router.patch(
  '/:id',
  upload.single('image'),
  validateService,
  localServiceController.updateService
);

router.delete('/:id', localServiceController.deleteService);

module.exports = router; 