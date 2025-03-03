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
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    text: {
        type: String,
        required: [true, 'Please add some text'],
        trim: true,
        maxlength: [500, 'Review cannot be more than 500 characters']
    },
    rating: {
        type: Number,
        required: [true, 'Please add a rating between 1 and 5'],
        min: 1,
        max: 5
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    itemType: {
        type: String,
        required: true,
        enum: ['hotel', 'flight', 'tour']
    },
    itemId: {
        type: mongoose.Schema.ObjectId,
        required: true,
        refPath: 'itemType'
    },
    photos: [{
        type: String,
        validate: {
            validator: function(url) {
                return /^https?:\/\/.*\.(jpeg|jpg|gif|png)$/.test(url);
            },
            message: 'Please provide valid image URLs'
        }
    }],
    likes: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    verified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Prevent user from submitting more than one review per item
reviewSchema.index({ user: 1, itemId: 1 }, { unique: true });

// Static method to calculate average rating
reviewSchema.statics.getAverageRating = async function(itemType, itemId) {
    const obj = await this.aggregate([
        {
            $match: { itemType, itemId: mongoose.Types.ObjectId(itemId) }
        },
        {
            $group: {
                _id: '$itemId',
                averageRating: { $avg: '$rating' },
                numberOfReviews: { $sum: 1 }
            }
        }
    ]);

    try {
        const Model = mongoose.model(
            itemType.charAt(0).toUpperCase() + itemType.slice(1)
        );

        await Model.findByIdAndUpdate(itemId, {
            averageRating: obj[0] ? Math.round(obj[0].averageRating * 10) / 10 : 0,
            numberOfReviews: obj[0] ? obj[0].numberOfReviews : 0
        });
    } catch (err) {
        console.error(err);
    }
};

// Call getAverageRating after save
reviewSchema.post('save', async function() {
    await this.constructor.getAverageRating(this.itemType, this.itemId);
});

// Call getAverageRating after remove
reviewSchema.post('remove', async function() {
    await this.constructor.getAverageRating(this.itemType, this.itemId);
});

// Update timestamps on save
reviewSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Populate user info when querying reviews
reviewSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: 'name avatar'
    });
    next();
});

module.exports = mongoose.model('Review', reviewSchema); 