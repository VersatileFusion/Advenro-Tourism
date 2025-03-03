const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       required:
 *         - user
 *         - itemId
 *         - bookingType
 *         - startDate
 *         - totalPrice
 *       properties:
 *         user:
 *           type: string
 *           description: User ID who made the booking
 *         itemId:
 *           type: string
 *           description: ID of the booked item (hotel, flight, or tour)
 *         bookingType:
 *           type: string
 *           enum: [hotel, flight, tour]
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         totalPrice:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, refunded]
 */

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Booking must belong to a user']
    },
    itemId: {
        type: mongoose.Schema.ObjectId,
        required: [true, 'Booking must have a reference item'],
        refPath: 'bookingType'
    },
    bookingType: {
        type: String,
        required: true,
        enum: ['Hotel', 'Flight', 'Tour']
    },
    startDate: {
        type: Date,
        required: [true, 'Booking must have a start date']
    },
    endDate: {
        type: Date
    },
    totalPrice: {
        type: Number,
        required: [true, 'Booking must have a price']
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    guests: {
        adults: {
            type: Number,
            default: 1
        },
        children: {
            type: Number,
            default: 0
        }
    },
    specialRequests: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create indexes for common queries
bookingSchema.index({ user: 1, startDate: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ itemId: 1, bookingType: 1 });

// Middleware to populate referenced item
bookingSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: 'name email'
    });
    next();
});

// Virtual property to calculate duration
bookingSchema.virtual('duration').get(function() {
    if (!this.endDate) return 1;
    const days = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 1;
});

module.exports = mongoose.model('Booking', bookingSchema); 