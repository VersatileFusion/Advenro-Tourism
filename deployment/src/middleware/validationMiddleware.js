const Joi = require('joi');
const logger = require('../services/loggingService');

class ValidationMiddleware {
    constructor() {
        this.schemas = {
            user: {
                create: Joi.object({
                    name: Joi.string().min(2).max(50).required(),
                    email: Joi.string().email().required(),
                    password: Joi.string()
                        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
                        .required()
                        .messages({
                            'string.pattern.base': 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character'
                        }),
                    role: Joi.string().valid('user', 'admin', 'guide').default('user'),
                    phoneNumber: Joi.string().pattern(/^\+?[\d\s-]{10,}$/).optional()
                }),
                update: Joi.object({
                    name: Joi.string().min(2).max(50).optional(),
                    email: Joi.string().email().optional(),
                    phoneNumber: Joi.string().pattern(/^\+?[\d\s-]{10,}$/).optional(),
                    preferences: Joi.object({
                        currency: Joi.string().valid('USD', 'EUR', 'GBP').optional(),
                        language: Joi.string().valid('en', 'es', 'fr').optional(),
                        notifications: Joi.boolean().optional()
                    }).optional()
                })
            },
            booking: {
                create: Joi.object({
                    tourId: Joi.string().required(),
                    startDate: Joi.date().greater('now').required(),
                    endDate: Joi.date().greater(Joi.ref('startDate')).required(),
                    numberOfPeople: Joi.number().integer().min(1).max(20).required(),
                    specialRequirements: Joi.string().max(500).optional(),
                    paymentMethod: Joi.string().valid('card', 'paypal').required()
                }),
                update: Joi.object({
                    startDate: Joi.date().greater('now').optional(),
                    endDate: Joi.date().greater(Joi.ref('startDate')).optional(),
                    numberOfPeople: Joi.number().integer().min(1).max(20).optional(),
                    specialRequirements: Joi.string().max(500).optional(),
                    status: Joi.string().valid('pending', 'confirmed', 'cancelled').optional()
                })
            },
            tour: {
                create: Joi.object({
                    name: Joi.string().min(5).max(100).required(),
                    description: Joi.string().min(20).max(2000).required(),
                    price: Joi.number().positive().required(),
                    duration: Joi.number().integer().positive().required(),
                    maxGroupSize: Joi.number().integer().min(1).max(50).required(),
                    difficulty: Joi.string().valid('easy', 'medium', 'difficult').required(),
                    startDates: Joi.array().items(Joi.date().greater('now')).min(1).required(),
                    locations: Joi.array().items(
                        Joi.object({
                            name: Joi.string().required(),
                            coordinates: Joi.array().length(2).items(Joi.number()).required(),
                            description: Joi.string().optional()
                        })
                    ).min(1).required()
                }),
                update: Joi.object({
                    name: Joi.string().min(5).max(100).optional(),
                    description: Joi.string().min(20).max(2000).optional(),
                    price: Joi.number().positive().optional(),
                    duration: Joi.number().integer().positive().optional(),
                    maxGroupSize: Joi.number().integer().min(1).max(50).optional(),
                    difficulty: Joi.string().valid('easy', 'medium', 'difficult').optional(),
                    startDates: Joi.array().items(Joi.date().greater('now')).min(1).optional(),
                    locations: Joi.array().items(
                        Joi.object({
                            name: Joi.string().required(),
                            coordinates: Joi.array().length(2).items(Joi.number()).required(),
                            description: Joi.string().optional()
                        })
                    ).min(1).optional()
                })
            },
            review: {
                create: Joi.object({
                    tourId: Joi.string().required(),
                    rating: Joi.number().min(1).max(5).required(),
                    review: Joi.string().min(10).max(1000).required(),
                    photos: Joi.array().items(Joi.string().uri()).max(5).optional()
                }),
                update: Joi.object({
                    rating: Joi.number().min(1).max(5).optional(),
                    review: Joi.string().min(10).max(1000).optional(),
                    photos: Joi.array().items(Joi.string().uri()).max(5).optional()
                })
            }
        };
    }

    validate(schema, property = 'body') {
        return async (req, res, next) => {
            try {
                const validationSchema = this.schemas[schema.entity][schema.action];
                if (!validationSchema) {
                    throw new Error(`Validation schema not found for ${schema.entity}.${schema.action}`);
                }

                const { error, value } = validationSchema.validate(req[property], {
                    abortEarly: false,
                    stripUnknown: true
                });

                if (error) {
                    const errors = error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message
                    }));

                    logger.warn('Validation error', {
                        schema: `${schema.entity}.${schema.action}`,
                        errors
                    });

                    return res.status(400).json({
                        success: false,
                        errors
                    });
                }

                // Replace request data with validated data
                req[property] = value;
                next();
            } catch (error) {
                logger.error('Validation middleware error', error);
                next(error);
            }
        };
    }

    sanitize(data) {
        // Basic XSS prevention
        if (typeof data === 'string') {
            return data
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;');
        }

        if (Array.isArray(data)) {
            return data.map(item => this.sanitize(item));
        }

        if (typeof data === 'object' && data !== null) {
            const sanitized = {};
            for (const [key, value] of Object.entries(data)) {
                sanitized[key] = this.sanitize(value);
            }
            return sanitized;
        }

        return data;
    }

    sanitizeMiddleware() {
        return (req, res, next) => {
            try {
                req.body = this.sanitize(req.body);
                req.query = this.sanitize(req.query);
                req.params = this.sanitize(req.params);
                next();
            } catch (error) {
                logger.error('Sanitization middleware error', error);
                next(error);
            }
        };
    }

    validateId(paramName = 'id') {
        return (req, res, next) => {
            const id = req.params[paramName];
            const mongoIdPattern = /^[0-9a-fA-F]{24}$/;

            if (!mongoIdPattern.test(id)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid ${paramName} format`
                });
            }

            next();
        };
    }

    validateQuery() {
        return (req, res, next) => {
            const querySchema = Joi.object({
                page: Joi.number().integer().min(1).optional(),
                limit: Joi.number().integer().min(1).max(100).optional(),
                sort: Joi.string().optional(),
                fields: Joi.string().optional(),
                search: Joi.string().min(2).max(50).optional()
            });

            const { error } = querySchema.validate(req.query);

            if (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid query parameters'
                });
            }

            next();
        };
    }

    validateDateRange() {
        return (req, res, next) => {
            const dateRangeSchema = Joi.object({
                startDate: Joi.date().iso().required(),
                endDate: Joi.date().iso().greater(Joi.ref('startDate')).required()
            });

            const { error } = dateRangeSchema.validate(req.query);

            if (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid date range'
                });
            }

            next();
        };
    }
}

module.exports = new ValidationMiddleware(); 