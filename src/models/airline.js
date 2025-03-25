const mongoose = require('mongoose');

const airlineSchema = new mongoose.Schema({
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
    logo: {
        type: String,
        required: true
    },
    website: {
        type: String
    },
    phone: {
        type: String
    },
    email: {
        type: String
    },
    headquarters: {
        city: String,
        country: String
    },
    fleet: [{
        aircraft: String,
        count: Number
    }],
    destinations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airport'
    }],
    alliances: [{
        type: String,
        enum: ['Star Alliance', 'Oneworld', 'SkyTeam', 'None']
    }],
    services: [{
        type: String,
        enum: ['domestic', 'international', 'cargo', 'charter']
    }],
    rating: {
        overall: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        count: {
            type: Number,
            default: 0
        }
    },
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
airlineSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Indexes for better query performance
airlineSchema.index({ code: 1 });
airlineSchema.index({ name: 'text' });
airlineSchema.index({ 'rating.overall': -1 });

const Airline = mongoose.model('Airline', airlineSchema);

module.exports = Airline; 