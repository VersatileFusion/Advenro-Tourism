const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    country: {
        type: String,
        required: true
    },
    region: {
        type: String
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
    coordinates: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: [Number]
    },
    climate: {
        type: String,
        enum: ['tropical', 'temperate', 'arctic', 'desert', 'mediterranean']
    },
    bestTimeToVisit: {
        months: [{
            type: Number,
            min: 1,
            max: 12
        }],
        description: String
    },
    attractions: [{
        name: String,
        description: String,
        image: String,
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: [Number]
        }
    }],
    activities: [{
        type: String,
        enum: ['hiking', 'cultural', 'adventure', 'relaxation', 'shopping', 'food']
    }],
    languages: [{
        type: String
    }],
    currency: {
        code: String,
        symbol: String
    },
    timezone: {
        type: String,
        required: true
    },
    safety: {
        level: {
            type: String,
            enum: ['safe', 'moderate', 'caution', 'unsafe'],
            default: 'safe'
        },
        notes: String
    },
    tours: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
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
destinationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Indexes for better query performance
destinationSchema.index({ name: 'text', country: 'text', region: 'text' });
destinationSchema.index({ coordinates: '2dsphere' });
destinationSchema.index({ 'attractions.coordinates': '2dsphere' });

const Destination = mongoose.model('Destination', destinationSchema);

module.exports = Destination; 