const mongoose = require('mongoose');

const localServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Service description is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Transportation', 'Food Delivery', 'Shopping', 'Beauty', 'Fitness', 'Other']
  },
  price: {
    base: {
      type: Number,
      required: [true, 'Base price is required']
    },
    unit: {
      type: String,
      default: 'per service'
    }
  },
  image: {
    type: String,
    default: 'default-service.jpg'
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  provider: {
    name: {
      type: String,
      required: [true, 'Provider name is required']
    },
    contactInfo: {
      phone: String,
      email: String,
      website: String
    },
    location: {
      address: String,
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      }
    }
  },
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    schedule: [{
      day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      },
      openTime: String,
      closeTime: String
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  active: {
    type: Boolean,
    default: true
  }
});

// Index for location-based queries
localServiceSchema.index({ 'provider.location.coordinates': '2dsphere' });

// Index for category and name for faster searches
localServiceSchema.index({ category: 1, name: 1 });

// Pre-save middleware to update the updatedAt field
localServiceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for service URL
localServiceSchema.virtual('url').get(function() {
  return `/local-services/${this._id}`;
});

const LocalService = mongoose.model('LocalService', localServiceSchema);

module.exports = LocalService; 