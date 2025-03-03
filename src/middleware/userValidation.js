const { check, validationResult } = require('express-validator');
const ErrorResponse = require('../utils/errorResponse');

exports.validateProfileUpdate = [
    check('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    
    check('phone')
        .optional()
        .matches(/^\+?[\d\s-]+$/)
        .withMessage('Please provide a valid phone number'),
    
    check('address.street')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Street address cannot exceed 100 characters'),
    
    check('address.city')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('City name cannot exceed 50 characters'),
    
    check('address.state')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('State name cannot exceed 50 characters'),
    
    check('address.zipCode')
        .optional()
        .trim()
        .isLength({ max: 20 })
        .withMessage('Zip code cannot exceed 20 characters'),
    
    check('address.country')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Country name cannot exceed 50 characters'),
    
    check('preferences.currency')
        .optional()
        .isIn(['USD', 'EUR', 'GBP'])
        .withMessage('Invalid currency selection'),
    
    check('preferences.language')
        .optional()
        .isIn(['en', 'es', 'fr'])
        .withMessage('Invalid language selection'),
    
    check('preferences.notifications.email')
        .optional()
        .isBoolean()
        .withMessage('Email notification must be boolean'),
    
    check('preferences.notifications.sms')
        .optional()
        .isBoolean()
        .withMessage('SMS notification must be boolean'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ErrorResponse(errors.array()[0].msg, 400));
        }
        next();
    }
];

exports.validateEmailUpdate = [
    check('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address'),
    
    check('password')
        .trim()
        .notEmpty()
        .withMessage('Please provide your current password'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ErrorResponse(errors.array()[0].msg, 400));
        }
        next();
    }
];

exports.validatePasswordUpdate = [
    check('currentPassword')
        .trim()
        .notEmpty()
        .withMessage('Please provide your current password'),
    
    check('newPassword')
        .trim()
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ErrorResponse(errors.array()[0].msg, 400));
        }
        next();
    }
];

exports.validateAvatarUpload = (req, res, next) => {
    if (!req.files || !req.files.avatar) {
        return next(new ErrorResponse('Please upload an avatar image', 400));
    }

    const file = req.files.avatar;

    // Check if it's an image
    if (!file.mimetype.startsWith('image')) {
        return next(new ErrorResponse('Please upload an image file', 400));
    }

    // Check file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
        return next(new ErrorResponse('Image size should not exceed 2MB', 400));
    }

    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    const fileExt = path.extname(file.name).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
        return next(new ErrorResponse('Please upload a JPG or PNG image', 400));
    }

    next();
}; 