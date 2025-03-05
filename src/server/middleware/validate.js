const Joi = require('joi');

exports.validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, {
        abortEarly: false,
        allowUnknown: true
    });

    if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: errorMessages
        });
    }

    next();
};

// Validation schemas
exports.schemas = {
    register: Joi.object({
        firstName: Joi.string().required().min(2).max(50),
        lastName: Joi.string().required().min(2).max(50),
        email: Joi.string().email().required(),
        password: Joi.string().required().min(6),
        phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
        address: Joi.string().max(200)
    }),

    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    forgotPassword: Joi.object({
        email: Joi.string().email().required()
    }),

    resetPassword: Joi.object({
        token: Joi.string().required(),
        password: Joi.string().required().min(6)
    }),

    updateProfile: Joi.object({
        firstName: Joi.string().min(2).max(50),
        lastName: Joi.string().min(2).max(50),
        phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
        address: Joi.string().max(200)
    }),

    updateSettings: Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().min(6),
        preferences: Joi.object({
            emailNotifications: Joi.boolean(),
            smsNotifications: Joi.boolean(),
            newsletter: Joi.boolean()
        })
    })
}; 