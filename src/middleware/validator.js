const { validationResult, check } = require('express-validator');

// Validation error handler middleware
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

// Auth validation rules
exports.registerValidation = [
    check('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    check('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please include a valid email'),
    check('password')
        .trim()
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    validateRequest
];

// Tourism validation rules
exports.hotelValidation = [
    check('name')
        .trim()
        .notEmpty()
        .withMessage('Hotel name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    check('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required'),
    check('price')
        .notEmpty()
        .withMessage('Price is required')
        .isNumeric()
        .withMessage('Price must be a number'),
    check('location')
        .notEmpty()
        .withMessage('Location is required'),
    check('rating')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('Rating must be between 0 and 5'),
    validateRequest
];

exports.flightValidation = [
    check('flightNumber')
        .trim()
        .notEmpty()
        .withMessage('Flight number is required'),
    check('departure')
        .notEmpty()
        .withMessage('Departure details are required'),
    check('arrival')
        .notEmpty()
        .withMessage('Arrival details are required'),
    check('price')
        .notEmpty()
        .withMessage('Price is required')
        .isNumeric()
        .withMessage('Price must be a number'),
    check('seats')
        .notEmpty()
        .withMessage('Available seats are required')
        .isNumeric()
        .withMessage('Seats must be a number'),
    validateRequest
];

exports.tourValidation = [
    check('name')
        .trim()
        .notEmpty()
        .withMessage('Tour name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    check('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required'),
    check('price')
        .notEmpty()
        .withMessage('Price is required')
        .isNumeric()
        .withMessage('Price must be a number'),
    check('duration')
        .notEmpty()
        .withMessage('Duration is required')
        .isNumeric()
        .withMessage('Duration must be a number'),
    check('maxGroupSize')
        .notEmpty()
        .withMessage('Max group size is required')
        .isNumeric()
        .withMessage('Max group size must be a number'),
    validateRequest
];

exports.bookingValidation = [
    check('userId')
        .notEmpty()
        .withMessage('User ID is required'),
    check('itemId')
        .notEmpty()
        .withMessage('Item ID is required'),
    check('bookingType')
        .notEmpty()
        .withMessage('Booking type is required')
        .isIn(['flight', 'hotel', 'tour'])
        .withMessage('Invalid booking type'),
    check('startDate')
        .notEmpty()
        .withMessage('Start date is required')
        .isISO8601()
        .withMessage('Invalid date format'),
    check('endDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format'),
    validateRequest
]; 