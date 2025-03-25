const mongoose = require('mongoose');

const airportSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    city: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    timezone: {
        type: String,
        required: true
    },
    coordinates: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        }
    },
    terminals: [{
        name: String,
        gates: [String]
    }],
    facilities: [{
        type: String,
        enum: ['restaurants', 'shops', 'lounges', 'parking', 'car-rental', 'hotel']
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
airportSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Indexes for better query performance
airportSchema.index({ code: 1 });
airportSchema.index({ city: 1, country: 1 });
airportSchema.index({ name: 'text', city: 'text', country: 'text' });

const Airport = mongoose.model('Airport', airportSchema);

module.exports = Airport; 