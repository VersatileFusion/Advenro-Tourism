const { validationResult, check, body } = require('express-validator');

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
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2 })
            .withMessage('Name must be at least 2 characters long'),
        body('phone')
            .optional()
            .matches(/^\+?[\d\s-]+$/)
            .withMessage('Invalid phone number format'),
        body('address.street').optional().trim(),
        body('address.city').optional().trim(),
        body('address.state').optional().trim(),
        body('address.zipCode').optional().trim(),
        body('address.country').optional().trim()
    ],
    updateEmail: [
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email'),
        body('password')
            .notEmpty()
            .withMessage('Please provide your current password')
    ],
    updatePassword: [
        body('currentPassword')
            .notEmpty()
            .withMessage('Please provide your current password'),
        body('newPassword')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character')
    ],
    enable2FA: [
        body('token')
            .notEmpty()
            .withMessage('Please provide the authentication code')
            .isLength({ min: 6, max: 6 })
            .withMessage('Authentication code must be 6 digits')
            .matches(/^\d+$/)
            .withMessage('Authentication code must contain only numbers')
    ],
    updateUser: [
        body('name').optional().trim().isLength({ min: 2 }),
        body('email').optional().isEmail(),
        body('role').optional().isIn(['user', 'admin', 'guide']),
        body('status').optional().isIn(['active', 'inactive', 'suspended'])
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
    ]
};

// Middleware to validate request data
const validateRequest = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        res.status(400).json({
            success: false,
            errors: errors.array()
        });
    };
};

module.exports = { validate: validateRequest, schemas }; 