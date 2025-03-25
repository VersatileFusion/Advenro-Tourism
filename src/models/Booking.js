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

const passengerSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    passportNumber: {
        type: String,
        required: true
    },
    passportExpiry: {
        type: Date,
        required: true
    },
    nationality: {
        type: String,
        required: true
    },
    seatNumber: String
});

const contactInfoSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
    }
});

const bookingSchema = new mongoose.Schema({
    flight: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flight',
        required: true
    },
    bookingNumber: {
        type: String,
        required: true,
        unique: true
    },
    passengers: [passengerSchema],
    contactInfo: contactInfoSchema,
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded', 'failed'],
        default: 'pending'
    },
    totalPrice: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'debit_card', 'bank_transfer', 'paypal'],
        required: true
    },
    paymentDetails: {
        transactionId: String,
        paymentDate: Date
    },
    specialRequests: [{
        type: String,
        enum: ['wheelchair', 'special_meal', 'extra_baggage', 'priority_checkin']
    }],
    cancellationReason: String,
    cancellationDate: Date,
    refundAmount: Number,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
bookingSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Generate unique booking number
bookingSchema.pre('save', async function(next) {
    if (!this.bookingNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.bookingNumber = `BK${year}${month}${random}`;
    }
    next();
});

// Indexes for better query performance
bookingSchema.index({ bookingNumber: 1 });
bookingSchema.index({ 'contactInfo.userId': 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking; 