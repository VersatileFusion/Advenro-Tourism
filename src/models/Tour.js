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
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    images: [{
        type: String
    }],
    destination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Destination',
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    maxGroupSize: {
        type: Number,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'moderate', 'difficult'],
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    priceDiscount: {
        type: Number,
        default: 0
    },
    summary: {
        type: String,
        required: true
    },
    tourType: {
        type: String,
        enum: ['guided', 'self-guided', 'private', 'group'],
        required: true
    },
    activities: [{
        type: String,
        enum: ['hiking', 'cultural', 'adventure', 'relaxation']
    }],
    features: [{
        type: String
    }],
    itinerary: [{
        day: {
            type: Number,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        }
    }],
    startDates: [{
        date: {
            type: Date,
            required: true
        },
        participants: {
            type: Number,
            default: 0
        }
    }],
    ratingsAverage: {
        type: Number,
        default: 0,
        min: [0, 'Rating must be above 0'],
        max: [5, 'Rating must be below 5'],
        set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    ratingsTotal: {
        type: Number,
        default: 0
    },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }],
    guides: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guide'
    }],
    locations: [{
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
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
tourSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Indexes for better query performance
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// Virtual populate reviews
tourSchema.virtual('tourReviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

// Virtual property for discounted price
tourSchema.virtual('discountedPrice').get(function() {
    return this.price * (1 - this.priceDiscount / 100);
});

// Document middleware to run before .save() and .create()
tourSchema.pre('save', function(next) {
    // Update ratings average based on ratings already stored in the document
    // Not trying to access virtual reviews
    if (this.ratingsQuantity > 0) {
        // Using the stored ratings data instead of virtual reviews
        this.ratingsAverage = this.ratingsTotal / this.ratingsQuantity;
    }
    next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour; 