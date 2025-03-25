const { check, validationResult } = require('express-validator');
const ErrorResponse = require('../utils/errorResponse');

exports.validateReview = [
    check('title')
        .trim()
        .notEmpty()
        .withMessage('Please add a title')
        .isLength({ max: 100 })
        .withMessage('Title cannot be more than 100 characters'),

    check('text')
        .trim()
        .notEmpty()
        .withMessage('Please add review text')
        .isLength({ max: 500 })
        .withMessage('Review cannot be more than 500 characters'),

    check('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),

    check('photos')
        .optional()
        .isArray()
        .withMessage('Photos must be an array')
        .custom((photos) => {
            if (photos.length > 5) {
                throw new Error('Maximum 5 photos allowed');
            }
            photos.forEach(url => {
                if (!/^https?:\/\/.*\.(jpeg|jpg|gif|png)$/.test(url)) {
                    throw new Error('Invalid image URL');
                }
            });
            return true;
        }),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ErrorResponse(errors.array()[0].msg, 400));
        }
        next();
    }
]; 