const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Flight:
 *       type: object
 *       required:
 *         - flightNumber
 *         - departure
 *         - arrival
 *         - price
 *         - seats
 *       properties:
 *         flightNumber:
 *           type: string
 *           description: Unique flight number
 *         departure:
 *           type: object
 *           properties:
 *             airport:
 *               type: string
 *             city:
 *               type: string
 *             country:
 *               type: string
 *             date:
 *               type: string
 *               format: date-time
 *         arrival:
 *           type: object
 *           properties:
 *             airport:
 *               type: string
 *             city:
 *               type: string
 *             country:
 *               type: string
 *             date:
 *               type: string
 *               format: date-time
 *         airline:
 *           type: string
 *         price:
 *           type: number
 *         seats:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *             available:
 *               type: number
 *         class:
 *           type: string
 *           enum: [economy, business, first]
 */

const flightSchema = new mongoose.Schema({
    airline: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airline',
        required: true
    },
    flightNumber: {
        type: String,
        required: true
    },
    departure: {
        airport: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Airport',
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        time: {
            type: String,
            required: true
        }
    },
    arrival: {
        airport: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Airport',
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        time: {
            type: String,
            required: true
        }
    },
    duration: {
        type: String,
        required: true
    },
    stops: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: true
    },
    availableSeats: {
        type: Number,
        required: true
    },
    aircraft: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'delayed', 'cancelled', 'completed'],
        default: 'scheduled'
    },
    baggageAllowance: {
        checked: {
            type: Number,
            default: 20
        },
        cabin: {
            type: Number,
            default: 7
        }
    },
    amenities: [{
        type: String,
        enum: ['wifi', 'entertainment', 'meals', 'drinks', 'power-outlet']
    }],
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
flightSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Indexes for better query performance
flightSchema.index({ 'departure.airport': 1, 'arrival.airport': 1, 'departure.date': 1 });
flightSchema.index({ flightNumber: 1, airline: 1 }, { unique: true });

const Flight = mongoose.model('Flight', flightSchema);

module.exports = Flight; 