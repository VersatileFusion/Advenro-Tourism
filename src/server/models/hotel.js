const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Hotel name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        minlength: [10, 'Description must be at least 10 characters long'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    location: {
        type: {
            coordinates: {
                type: [Number],
                required: [true, 'Coordinates are required'],
                validate: {
                    validator: function(v) {
                        return v.length === 2;
                    },
                    message: 'Coordinates must be [longitude, latitude]'
                }
            },
            country: {
                type: String,
                required: [true, 'Country is required']
            },
            city: {
                type: String,
                required: [true, 'City is required']
            },
            address: {
                type: String,
                required: [true, 'Address is required']
            }
        },
        required: [true, 'Location is required']
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Hotel owner is required']
    },
    images: [{
        type: String,
        validate: {
            validator: function(v) {
                return /^https?:\/\/.*/.test(v);
            },
            message: 'Image URL must be a valid URL'
        }
    }],
    amenities: [{
        type: String,
        enum: [
            'wifi', 'parking', 'pool', 'spa', 'gym',
            'restaurant', 'bar', 'room-service', 'laundry',
            'air-conditioning', 'heating', 'tv', 'minibar'
        ]
    }],
    category: {
        type: String,
        required: [true, 'Hotel category is required'],
        enum: ['hotel', 'resort', 'apartment', 'villa', 'hostel']
    },
    starRating: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },
    contactInfo: {
        phone: {
            type: String,
            validate: {
                validator: function(v) {
                    return /^\+?[1-9]\d{1,14}$/.test(v);
                },
                message: 'Please enter a valid phone number'
            }
        },
        email: {
            type: String,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
        },
        website: {
            type: String,
            match: [/^https?:\/\/.*/, 'Please enter a valid URL']
        }
    },
    policies: {
        checkIn: String,
        checkOut: String,
        cancellation: String,
        houseRules: [String]
    },
    rooms: [{
        name: {
            type: String,
            required: [true, 'Room name is required'],
            trim: true
        },
        type: {
            type: String,
            required: [true, 'Room type is required'],
            enum: ['single', 'double', 'twin', 'suite', 'deluxe']
        },
        description: String,
        capacity: {
            type: Number,
            required: [true, 'Room capacity is required'],
            min: [1, 'Capacity must be at least 1']
        },
        price: {
            type: Number,
            required: [true, 'Room price is required'],
            min: [0, 'Price cannot be negative']
        },
        amenities: [String],
        images: [String],
        size: Number,
        bedType: String,
        availability: {
            startDate: Date,
            endDate: Date,
            quantity: {
                type: Number,
                min: 0
            }
        },
        bookings: [{
            checkIn: Date,
            checkOut: Date,
            guest: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            status: {
                type: String,
                enum: ['pending', 'confirmed', 'cancelled'],
                default: 'pending'
            }
        }]
    }],
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }],
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Create indexes
hotelSchema.index({ name: 'text', description: 'text' });
hotelSchema.index({ 'location.coordinates': '2dsphere' });

// Calculate average rating when reviews are modified
hotelSchema.methods.calculateAverageRating = async function() {
    const reviews = await mongoose.model('Review').find({ hotel: this._id });
    if (reviews.length === 0) {
        this.rating = 0;
    } else {
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        this.rating = Math.round((sum / reviews.length) * 10) / 10;
    }
    await this.save();
};

// Check if model exists before compiling
const Hotel = mongoose.models.Hotel || mongoose.model('Hotel', hotelSchema);

module.exports = Hotel; 