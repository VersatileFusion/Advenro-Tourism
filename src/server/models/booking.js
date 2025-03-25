const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Booking must belong to a user']
    },
    hotel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel',
        required: [true, 'Booking must belong to a hotel']
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Booking must be for a specific room']
    },
    checkIn: {
        type: Date,
        required: [true, 'Check-in date is required']
    },
    checkOut: {
        type: Date,
        required: [true, 'Check-out date is required']
    },
    guests: {
        adults: {
            type: Number,
            required: [true, 'Number of adult guests is required'],
            min: [1, 'At least one adult guest is required']
        },
        children: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    totalPrice: {
        type: Number,
        required: [true, 'Total price is required'],
        min: [0, 'Total price cannot be negative']
    },
    payment: {
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded'],
            default: 'pending'
        },
        paymentIntentId: String,
        paymentMethodId: String,
        refundId: String
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    specialRequests: String,
    cancellationReason: String,
    cancellationDate: Date,
    refundAmount: Number
}, {
    timestamps: true
});

// Validate check-in and check-out dates
bookingSchema.pre('save', function(next) {
    if (this.checkIn >= this.checkOut) {
        next(new Error('Check-out date must be after check-in date'));
    }
    next();
});

// Calculate number of nights
bookingSchema.virtual('numberOfNights').get(function() {
    return Math.ceil((this.checkOut - this.checkIn) / (1000 * 60 * 60 * 24));
});

// Check if booking dates overlap with existing bookings
bookingSchema.methods.checkAvailability = async function() {
    const hotel = await mongoose.model('Hotel').findById(this.hotel);
    if (!hotel) {
        throw new Error('Hotel not found');
    }

    const room = hotel.rooms.id(this.room);
    if (!room) {
        throw new Error('Room not found');
    }

    const overlappingBookings = room.bookings.filter(booking => {
        return (
            booking.status !== 'cancelled' &&
            this.checkIn < booking.checkOut &&
            this.checkOut > booking.checkIn
        );
    });

    return overlappingBookings.length === 0;
};

// Cancel booking
bookingSchema.methods.cancel = async function(reason) {
    if (this.status === 'cancelled') {
        throw new Error('Booking is already cancelled');
    }

    if (this.status === 'completed') {
        throw new Error('Cannot cancel a completed booking');
    }

    this.status = 'cancelled';
    this.cancellationReason = reason;
    this.cancellationDate = new Date();

    // If payment was completed, initiate refund
    if (this.payment.status === 'completed') {
        const { processRefund } = require('../utils/payment');
        const refund = await processRefund(this.payment.paymentIntentId, this.totalPrice);
        
        if (refund.success) {
            this.payment.status = 'refunded';
            this.payment.refundId = refund.data.id;
            this.refundAmount = refund.data.amount;
        }
    }

    await this.save();
};

// Check if model exists before compiling
const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

module.exports = Booking; 