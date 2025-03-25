const { validationResult, body } = require('express-validator');

// Middleware to validate request
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

// Registration validation rules
const registerValidation = [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required')
];

// Login validation rules
const loginValidation = [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
];

// Hotel validation rules
const hotelValidation = [
    body('name').notEmpty().withMessage('Hotel name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('location').isObject().withMessage('Location is required'),
    body('location.coordinates').isArray().withMessage('Coordinates must be an array'),
    body('location.country').notEmpty().withMessage('Country is required'),
    body('location.city').notEmpty().withMessage('City is required'),
    body('location.address').notEmpty().withMessage('Address is required')
];

// Booking validation rules
const bookingValidation = [
    body('hotelId').notEmpty().withMessage('Hotel ID is required'),
    body('checkIn').isISO8601().withMessage('Check-in date must be valid'),
    body('checkOut').isISO8601().withMessage('Check-out date must be valid'),
    body('guests').isInt({ min: 1 }).withMessage('Number of guests must be at least 1'),
    body('rooms').isInt({ min: 1 }).withMessage('Number of rooms must be at least 1')
];

// Review validation rules
const reviewValidation = [
    body('hotelId').notEmpty().withMessage('Hotel ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').notEmpty().withMessage('Comment is required')
];

module.exports = {
    validateRequest,
    registerValidation,
    loginValidation,
    hotelValidation,
    bookingValidation,
    reviewValidation
}; 