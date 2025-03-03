const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Tour:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - price
 *         - duration
 *         - maxGroupSize
 *       properties:
 *         name:
 *           type: string
 *           description: Tour name
 *         description:
 *           type: string
 *           description: Detailed tour description
 *         price:
 *           type: number
 *           description: Tour price per person
 *         duration:
 *           type: number
 *           description: Tour duration in days
 *         maxGroupSize:
 *           type: number
 *           description: Maximum number of people in a group
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, difficult]
 *         rating:
 *           type: number
 *         locations:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               coordinates:
 *                 type: array
 *                 items:
 *                   type: number
 *         startDates:
 *           type: array
 *           items:
 *             type: string
 *             format: date-time
 */

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a tour name'],
        unique: true,
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    price: {
        type: Number,
        required: [true, 'Please add a price']
    },
    duration: {
        type: Number,
        required: [true, 'Please add tour duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'Please add group size']
    },
    difficulty: {
        type: String,
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty must be either: easy, medium, difficult'
        },
        default: 'medium'
    },
    rating: {
        type: Number,
        min: [0, 'Rating must be at least 0'],
        max: [5, 'Rating cannot be more than 5'],
        default: 0
    },
    locations: [{
        name: {
            type: String,
            required: [true, 'Location name is required']
        },
        coordinates: {
            type: [Number],
            required: [true, 'Coordinates are required'],
            index: '2dsphere'
        },
        description: String,
        day: Number
    }],
    startDates: [Date],
    images: {
        type: [String],
        default: ['default-tour.jpg']
    },
    included: {
        type: [String],
        default: []
    },
    excluded: {
        type: [String],
        default: []
    },
    highlights: {
        type: [String],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    active: {
        type: Boolean,
        default: true
    }
});

// Create indexes for common queries
tourSchema.index({ price: 1, rating: -1 });
tourSchema.index({ 'locations.coordinates': '2dsphere' });
tourSchema.index({ startDates: 1 });

// Virtual populate with reviews
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

module.exports = mongoose.model('Tour', tourSchema); 