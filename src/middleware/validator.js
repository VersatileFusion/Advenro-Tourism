const { validationResult, check, body } = require('express-validator');
const { validate } = require('./validate');

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

// Hotel validation rules
const hotelValidationRules = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Hotel name is required')
        .isLength({ max: 100 })
        .withMessage('Hotel name cannot be more than 100 characters'),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Hotel description is required')
        .isLength({ max: 2000 })
        .withMessage('Description cannot be more than 2000 characters'),
    body('city')
        .trim()
        .notEmpty()
        .withMessage('City is required'),
    body('address')
        .trim()
        .notEmpty()
        .withMessage('Address is required'),
    body('pricePerNight')
        .notEmpty()
        .withMessage('Price per night is required')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    body('rating')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('Rating must be between 0 and 5')
];

// Flight validation rules
const flightValidationRules = [
    body('flightNumber')
        .trim()
        .notEmpty()
        .withMessage('Flight number is required'),
    body('airline')
        .trim()
        .notEmpty()
        .withMessage('Airline name is required'),
    body('departureCity')
        .trim()
        .notEmpty()
        .withMessage('Departure city is required'),
    body('arrivalCity')
        .trim()
        .notEmpty()
        .withMessage('Arrival city is required'),
    body('departureDate')
        .notEmpty()
        .withMessage('Departure date is required')
        .isISO8601()
        .withMessage('Invalid departure date format'),
    body('arrivalDate')
        .notEmpty()
        .withMessage('Arrival date is required')
        .isISO8601()
        .withMessage('Invalid arrival date format'),
    body('price.economy')
        .notEmpty()
        .withMessage('Economy class price is required')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    body('price.business')
        .notEmpty()
        .withMessage('Business class price is required')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    body('price.first')
        .notEmpty()
        .withMessage('First class price is required')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    body('availableSeats.economy')
        .notEmpty()
        .withMessage('Available economy seats is required')
        .isInt({ min: 0 })
        .withMessage('Available seats cannot be negative'),
    body('availableSeats.business')
        .notEmpty()
        .withMessage('Available business seats is required')
        .isInt({ min: 0 })
        .withMessage('Available seats cannot be negative'),
    body('availableSeats.first')
        .notEmpty()
        .withMessage('Available first class seats is required')
        .isInt({ min: 0 })
        .withMessage('Available seats cannot be negative'),
    body('aircraft')
        .trim()
        .notEmpty()
        .withMessage('Aircraft type is required'),
    body('duration')
        .notEmpty()
        .withMessage('Flight duration is required')
        .isInt({ min: 1 })
        .withMessage('Duration must be at least 1 minute')
];

// Export validation middleware
exports.hotelValidation = validate(hotelValidationRules);
exports.flightValidation = validate(flightValidationRules);

exports.tourValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Tour name is required')
        .isLength({ max: 100 })
        .withMessage('Tour name cannot be more than 100 characters'),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Tour description is required')
        .isLength({ max: 2000 })
        .withMessage('Description cannot be more than 2000 characters'),
    body('summary')
        .trim()
        .notEmpty()
        .withMessage('Tour summary is required'),
    body('difficulty')
        .trim()
        .notEmpty()
        .withMessage('Tour difficulty is required')
        .isIn(['easy', 'medium', 'difficult'])
        .withMessage('Difficulty must be either: easy, medium, difficult'),
    body('price')
        .notEmpty()
        .withMessage('Tour price is required')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    body('duration')
        .notEmpty()
        .withMessage('Tour duration is required')
        .isInt({ min: 1 })
        .withMessage('Duration must be at least 1'),
    body('maxGroupSize')
        .notEmpty()
        .withMessage('Maximum group size is required')
        .isInt({ min: 1 })
        .withMessage('Group size must be at least 1')
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

const reviewValidationRules = [
    body('review')
        .trim()
        .notEmpty()
        .withMessage('Review text is required')
        .isLength({ max: 1000 })
        .withMessage('Review cannot be more than 1000 characters'),
    body('rating')
        .notEmpty()
        .withMessage('Rating is required')
        .isFloat({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    body('tour')
        .optional()
        .isMongoId()
        .withMessage('Invalid tour ID'),
    body('user')
        .optional()
        .isMongoId()
        .withMessage('Invalid user ID')
];

exports.reviewValidation = validate(reviewValidationRules);

module.exports = {
    hotelValidation: validate(hotelValidationRules),
    tourValidation: validate(exports.tourValidation),
    flightValidation: validate(flightValidationRules),
    reviewValidation: validate(reviewValidationRules)
}; 