const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    },
    hotel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel',
        required: [true, 'Review must belong to a hotel']
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        minlength: [2, 'Title must be at least 2 characters long'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    comment: {
        type: String,
        required: [true, 'Comment is required'],
        trim: true,
        minlength: [10, 'Comment must be at least 10 characters long'],
        maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    stayDate: {
        type: Date
    },
    roomType: {
        type: String
    },
    photos: [{
        type: String,
        validate: {
            validator: function(v) {
                return /^https?:\/\/.*/.test(v);
            },
            message: 'Photo URL must be a valid URL'
        }
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Prevent duplicate reviews from the same user for the same hotel
reviewSchema.index({ user: 1, hotel: 1 }, { unique: true });

// Update hotel rating after review is saved
reviewSchema.post('save', async function() {
    const hotel = await mongoose.model('Hotel').findById(this.hotel);
    if (hotel) {
        await hotel.calculateAverageRating();
    }
});

// Update hotel rating after review is deleted
reviewSchema.post('remove', async function() {
    const hotel = await mongoose.model('Hotel').findById(this.hotel);
    if (hotel) {
        await hotel.calculateAverageRating();
    }
});

// Check if model exists before compiling
const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

module.exports = Review; 