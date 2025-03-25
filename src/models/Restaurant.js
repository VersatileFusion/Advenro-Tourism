const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Menu item name is required']
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Menu item price is required']
  },
  image: String,
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isVegan: {
    type: Boolean,
    default: false
  },
  isGlutenFree: {
    type: Boolean,
    default: false
  },
  isSpecial: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    enum: ['appetizer', 'main', 'dessert', 'drink', 'soup', 'salad', 'sides'],
    required: true
  },
  spicyLevel: {
    type: Number,
    min: 0,
    max: 3,
    default: 0
  }
});

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Restaurant description is required']
  },
  cuisineType: [{
    type: String,
    required: [true, 'Cuisine type is required'],
    enum: [
      'italian', 'chinese', 'japanese', 'mexican', 'indian', 
      'middle-eastern', 'american', 'french', 'vegetarian', 
      'vegan', 'seafood', 'bbq', 'fast-food', 'desserts', 'beverages'
    ]
  }],
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  location: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  businessHours: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    openTime: String,
    closeTime: String,
    isClosed: {
      type: Boolean,
      default: false
    }
  }],
  menu: [menuItemSchema],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Review'
  }],
  reviewCount: {
    type: Number,
    default: 0
  },
  priceLevel: {
    type: Number,
    min: 1,
    max: 4,
    default: 2 // 1: $, 2: $$, 3: $$$, 4: $$$$
  },
  features: {
    delivery: {
      type: Boolean,
      default: false
    },
    takeout: {
      type: Boolean,
      default: false
    },
    reservations: {
      type: Boolean,
      default: false
    },
    outdoor: {
      type: Boolean,
      default: false
    },
    creditCards: {
      type: Boolean,
      default: true
    },
    alcohol: {
      type: String,
      enum: ['none', 'beer-wine', 'full-bar'],
      default: 'none'
    },
    parking: {
      type: String,
      enum: ['none', 'street', 'garage', 'valet', 'lot'],
      default: 'none'
    },
    wifi: {
      type: Boolean,
      default: false
    }
  },
  images: [String],
  coverImage: {
    type: String,
    default: 'default-restaurant.jpg'
  },
  active: {
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
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for efficient querying
restaurantSchema.index({ location: '2dsphere' });
restaurantSchema.index({ cuisineType: 1 });
restaurantSchema.index({ averageRating: -1 });

// Virtual for price level format
restaurantSchema.virtual('priceLevelFormat').get(function() {
  return '$'.repeat(this.priceLevel);
});

// Pre-save middleware to update timestamps
restaurantSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Middleware to populate reviews when finding a restaurant
restaurantSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'reviews',
    select: 'review rating user createdAt'
  });
  next();
});

// Static method to find restaurants near a location
restaurantSchema.statics.getRestaurantsNearby = async function(lng, lat, distance, limit) {
  const restaurants = await this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: distance
      }
    },
    active: true
  }).limit(limit);
  
  return restaurants;
};

// Static method to find restaurants by cuisine type
restaurantSchema.statics.findByCuisineType = async function(cuisineType) {
  return await this.find({
    cuisineType: cuisineType,
    active: true
  });
};

// Method to calculate the average rating
restaurantSchema.methods.calculateAverageRating = async function() {
  const Restaurant = this.constructor;
  const aggregateData = await mongoose.model('Review').aggregate([
    {
      $match: { restaurant: this._id }
    },
    {
      $group: {
        _id: '$restaurant',
        averageRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  if (aggregateData.length > 0) {
    this.averageRating = aggregateData[0].averageRating;
    this.reviewCount = aggregateData[0].count;
  } else {
    this.averageRating = 0;
    this.reviewCount = 0;
  }
  
  await this.save();
};

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant; 