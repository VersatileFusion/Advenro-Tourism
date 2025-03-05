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
    flightNumber: {
        type: String,
        required: [true, 'Please add a flight number'],
        unique: true,
        trim: true
    },
    departure: {
        airport: {
            type: String,
            required: [true, 'Please add departure airport']
        },
        city: {
            type: String,
            required: [true, 'Please add departure city']
        },
        country: {
            type: String,
            required: [true, 'Please add departure country']
        },
        date: {
            type: Date,
            required: [true, 'Please add departure date']
        }
    },
    arrival: {
        airport: {
            type: String,
            required: [true, 'Please add arrival airport']
        },
        city: {
            type: String,
            required: [true, 'Please add arrival city']
        },
        country: {
            type: String,
            required: [true, 'Please add arrival country']
        },
        date: {
            type: Date,
            required: [true, 'Please add arrival date']
        }
    },
    airline: {
        type: String,
        required: [true, 'Please add airline name']
    },
    price: {
        type: Number,
        required: [true, 'Please add ticket price']
    },
    seats: {
        total: {
            type: Number,
            required: [true, 'Please add total seats']
        },
        available: {
            type: Number,
            required: [true, 'Please add available seats']
        }
    },
    class: {
        type: String,
        enum: ['economy', 'business', 'first'],
        default: 'economy'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create indexes for common queries
flightSchema.index({ 'departure.date': 1, 'departure.city': 1 });
flightSchema.index({ 'arrival.date': 1, 'arrival.city': 1 });
flightSchema.index({ price: 1 });

// Middleware to ensure available seats don't exceed total seats
flightSchema.pre('save', function(next) {
    if (this.seats.available > this.seats.total) {
        next(new Error('Available seats cannot exceed total seats'));
    }
    next();
});

module.exports = { schema: flightSchema }; 