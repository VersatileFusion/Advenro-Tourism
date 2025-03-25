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
    }),

    // Hotel schemas
    createHotel: Joi.object({
        name: Joi.string().required().min(2).max(100),
        description: Joi.string().required().min(10).max(2000),
        location: Joi.object({
            coordinates: Joi.array().items(Joi.number()).length(2).required(),
            country: Joi.string().required(),
            city: Joi.string().required(),
            address: Joi.string().required()
        }).required(),
        amenities: Joi.array().items(Joi.string()),
        category: Joi.string().required().valid('hotel', 'resort', 'apartment', 'villa', 'hostel'),
        starRating: Joi.number().min(1).max(5),
        contactInfo: Joi.object({
            phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
            email: Joi.string().email(),
            website: Joi.string().uri()
        }),
        policies: Joi.object({
            checkIn: Joi.string(),
            checkOut: Joi.string(),
            cancellation: Joi.string(),
            houseRules: Joi.array().items(Joi.string())
        })
    }),

    updateHotel: Joi.object({
        name: Joi.string().min(2).max(100),
        description: Joi.string().min(10).max(2000),
        location: Joi.object({
            coordinates: Joi.array().items(Joi.number()).length(2),
            country: Joi.string(),
            city: Joi.string(),
            address: Joi.string()
        }),
        amenities: Joi.array().items(Joi.string()),
        category: Joi.string().valid('hotel', 'resort', 'apartment', 'villa', 'hostel'),
        starRating: Joi.number().min(1).max(5),
        contactInfo: Joi.object({
            phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
            email: Joi.string().email(),
            website: Joi.string().uri()
        }),
        policies: Joi.object({
            checkIn: Joi.string(),
            checkOut: Joi.string(),
            cancellation: Joi.string(),
            houseRules: Joi.array().items(Joi.string())
        })
    }),

    createRoom: Joi.object({
        name: Joi.string().required().min(2).max(100),
        type: Joi.string().required().valid('single', 'double', 'twin', 'suite', 'deluxe'),
        description: Joi.string().required().min(10).max(1000),
        capacity: Joi.number().required().min(1),
        price: Joi.number().required().min(0),
        amenities: Joi.array().items(Joi.string()),
        size: Joi.number().min(0),
        bedType: Joi.string(),
        availability: Joi.object({
            startDate: Joi.date(),
            endDate: Joi.date(),
            quantity: Joi.number().min(0)
        })
    }),

    updateRoom: Joi.object({
        name: Joi.string().min(2).max(100),
        type: Joi.string().valid('single', 'double', 'twin', 'suite', 'deluxe'),
        description: Joi.string().min(10).max(1000),
        capacity: Joi.number().min(1),
        price: Joi.number().min(0),
        amenities: Joi.array().items(Joi.string()),
        size: Joi.number().min(0),
        bedType: Joi.string(),
        availability: Joi.object({
            startDate: Joi.date(),
            endDate: Joi.date(),
            quantity: Joi.number().min(0)
        })
    }),

    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        title: Joi.string().required().min(2).max(100),
        comment: Joi.string().required().min(10).max(1000),
        stayDate: Joi.date(),
        roomType: Joi.string(),
        photos: Joi.array().items(Joi.string().uri())
    }),

    // Booking schemas
    createBooking: Joi.object({
        hotelId: Joi.string().required(),
        roomId: Joi.string().required(),
        checkIn: Joi.date().required(),
        checkOut: Joi.date().required().greater(Joi.ref('checkIn')),
        guests: Joi.number().required().min(1),
        rooms: Joi.number().required().min(1),
        specialRequests: Joi.string(),
        paymentMethod: Joi.string().valid('credit_card', 'paypal', 'bank_transfer'),
        contactInfo: Joi.object({
            phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
            email: Joi.string().email()
        })
    }),

    updateBookingStatus: Joi.object({
        status: Joi.string().required().valid('pending', 'confirmed', 'cancelled', 'completed'),
        reason: Joi.string().when('status', {
            is: 'cancelled',
            then: Joi.string().required(),
            otherwise: Joi.string()
        })
    }),

    processPayment: Joi.object({
        paymentMethod: Joi.string().required().valid('credit_card', 'paypal', 'bank_transfer'),
        amount: Joi.number().required().min(0),
        currency: Joi.string().required().length(3),
        paymentDetails: Joi.object().required()
    })
}; 