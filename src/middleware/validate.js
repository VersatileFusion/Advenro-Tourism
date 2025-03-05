const { validationResult, check } = require('express-validator');

// Validation schemas
const schemas = {
    register: [
        check('name')
            .trim()
            .notEmpty()
            .withMessage('Name is required')
            .isLength({ max: 50 })
            .withMessage('Name cannot be more than 50 characters'),
        check('email')
            .trim()
            .notEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Please provide a valid email'),
        check('password')
            .trim()
            .notEmpty()
            .withMessage('Password is required')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters')
    ],
    login: [
        check('email')
            .trim()
            .notEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Please provide a valid email'),
        check('password')
            .trim()
            .notEmpty()
            .withMessage('Password is required')
    ],
    updateProfile: [
        check('name')
            .trim()
            .notEmpty()
            .withMessage('Name is required')
            .isLength({ max: 50 })
            .withMessage('Name cannot be more than 50 characters'),
        check('email')
            .trim()
            .notEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Please provide a valid email')
    ],
    createBooking: [
        check('item')
            .trim()
            .notEmpty()
            .withMessage('Item ID is required'),
        check('bookingType')
            .trim()
            .notEmpty()
            .withMessage('Booking type is required')
            .isIn(['Hotel', 'Flight', 'Tour'])
            .withMessage('Invalid booking type'),
        check('startDate')
            .trim()
            .notEmpty()
            .withMessage('Start date is required')
            .isISO8601()
            .withMessage('Invalid start date format'),
        check('endDate')
            .trim()
            .optional()
            .isISO8601()
            .withMessage('Invalid end date format'),
        check('guests.adults')
            .isInt({ min: 1 })
            .withMessage('At least 1 adult is required'),
        check('guests.children')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Number of children cannot be negative')
    ],
    updateBooking: [
        check('status')
            .optional()
            .isIn(['pending', 'confirmed', 'cancelled'])
            .withMessage('Invalid booking status'),
        check('paymentStatus')
            .optional()
            .isIn(['pending', 'completed', 'failed'])
            .withMessage('Invalid payment status'),
        check('specialRequests')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Special requests cannot exceed 500 characters')
    ],
    updateBookingStatus: [
        check('status')
            .trim()
            .notEmpty()
            .withMessage('Status is required')
            .isIn(['pending', 'confirmed', 'cancelled'])
            .withMessage('Invalid booking status')
    ],
    updateUser: [
        check('name')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('Name cannot be more than 50 characters'),
        check('email')
            .optional()
            .trim()
            .isEmail()
            .withMessage('Please provide a valid email'),
        check('role')
            .optional()
            .isIn(['user', 'admin', 'hotel_owner'])
            .withMessage('Invalid role')
    ]
};

// Middleware to validate request data
const validateRequest = (validations) => {
    return async (req, res, next) => {
        // Execute all validations
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    };
};

module.exports = { validate: validateRequest, schemas }; 