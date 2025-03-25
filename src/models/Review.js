const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       required:
 *         - title
 *         - text
 *         - rating
 *         - user
 *         - itemType
 *         - itemId
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the review
 *         text:
 *           type: string
 *           description: Review content
 *         rating:
 *           type: number
 *           description: Rating from 1 to 5
 *         user:
 *           type: string
 *           description: User ID who created the review
 *         itemType:
 *           type: string
 *           enum: [hotel, flight, tour]
 *           description: Type of item being reviewed
 *         itemId:
 *           type: string
 *           description: ID of the item being reviewed
 *         photos:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of photo URLs
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who liked the review
 *         verified:
 *           type: boolean
 *           description: Whether the review is from a verified booking
 */

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    tour: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    photos: [{
        type: String
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    helpful: {
        type: Number,
        default: 0
    },
    verified: {
        type: Boolean,
        default: false
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    }
});

// Prevent duplicate reviews from the same user for the same tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Static method to calculate average rating
reviewSchema.statics.calcAverageRating = async function(tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 0
        });
    }
};

// Call calcAverageRating after save
reviewSchema.post('save', function() {
    this.constructor.calcAverageRating(this.tour);
});

// Call calcAverageRating before remove
reviewSchema.pre(/^findOneAnd/, async function(next) {
    this.r = await this.findOne();
    next();
});

reviewSchema.post(/^findOneAnd/, async function() {
    await this.r.constructor.calcAverageRating(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 