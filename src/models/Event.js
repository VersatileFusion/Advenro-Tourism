const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ticket name is required']
  },
  description: String,
  price: {
    type: Number,
    required: [true, 'Ticket price is required']
  },
  availableQuantity: {
    type: Number,
    default: 100
  },
  soldQuantity: {
    type: Number,
    default: 0
  },
  maxPerPurchase: {
    type: Number,
    default: 10
  },
  benefits: [String],
  active: {
    type: Boolean,
    default: true
  }
});

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Event description is required']
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [200, 'Short description cannot be more than 200 characters']
  },
  type: {
    type: String,
    required: [true, 'Event type is required'],
    enum: ['music', 'art', 'food', 'sport', 'seasonal', 'family', 'other']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  startTime: String,
  endTime: String,
  location: {
    name: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    coordinates: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number] // [longitude, latitude]
    }
  },
  organizer: {
    name: {
      type: String, 
      required: [true, 'Organizer name is required']
    },
    website: String,
    email: String,
    phone: String,
    description: String,
    logo: String
  },
  coverImage: {
    type: String,
    default: 'default-event.jpg'
  },
  images: [String],
  tickets: [ticketSchema],
  isFree: {
    type: Boolean,
    default: false
  },
  minPrice: {
    type: Number,
    default: 0
  },
  maxPrice: {
    type: Number,
    default: 0
  },
  tags: [String],
  capacity: {
    type: Number,
    default: 0 // 0 means unlimited or unknown
  },
  currentAttendees: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  reviews: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Review'
  }],
  features: {
    handicapAccessible: {
      type: Boolean,
      default: false
    },
    familyFriendly: {
      type: Boolean,
      default: false
    },
    foodAvailable: {
      type: Boolean,
      default: false
    },
    alcoholServed: {
      type: Boolean,
      default: false
    },
    parkingAvailable: {
      type: Boolean,
      default: false
    },
    seatingProvided: {
      type: Boolean,
      default: false
    }
  },
  socialMedia: {
    facebook: String,
    twitter: String,
    instagram: String,
    hashtag: String
  },
  status: {
    type: String,
    enum: ['scheduled', 'postponed', 'canceled', 'completed'],
    default: 'scheduled'
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
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for efficient querying
eventSchema.index({ 'location.coordinates': '2dsphere' });
eventSchema.index({ startDate: 1 });
eventSchema.index({ type: 1 });
eventSchema.index({ 'tags': 1 });

// Pre-save middleware to update timestamps and calculate price range
eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate min and max price based on tickets
  if (this.tickets && this.tickets.length > 0) {
    const ticketPrices = this.tickets
      .filter(ticket => ticket.active)
      .map(ticket => ticket.price);
    
    if (ticketPrices.length > 0) {
      this.minPrice = Math.min(...ticketPrices);
      this.maxPrice = Math.max(...ticketPrices);
      
      // If all tickets are free, mark event as free
      this.isFree = ticketPrices.every(price => price === 0);
    }
  }
  
  next();
});

// Virtual property for event duration in days
eventSchema.virtual('durationDays').get(function() {
  if (!this.endDate || !this.startDate) return 1;
  
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays || 1; // Minimum 1 day
});

// Virtual property for whether the event is ongoing
eventSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  
  return now >= start && now <= end;
});

// Virtual property for whether the event has ended
eventSchema.virtual('hasEnded').get(function() {
  const now = new Date();
  const end = new Date(this.endDate);
  
  return now > end;
});

// Virtual property for formatted dates
eventSchema.virtual('formattedStartDate').get(function() {
  return new Date(this.startDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Static method to find upcoming events
eventSchema.statics.findUpcomingEvents = function(limit = 10) {
  const now = new Date();
  
  return this.find({
    startDate: { $gte: now },
    active: true,
    status: { $ne: 'canceled' }
  })
    .sort({ startDate: 1 })
    .limit(limit);
};

// Static method to find events near a location
eventSchema.statics.findEventsNearby = function(lng, lat, distance = 10000, limit = 10) {
  return this.find({
    'location.coordinates': {
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
};

// Method to calculate if tickets are sold out
eventSchema.methods.isTicketSoldOut = function(ticketId) {
  const ticket = this.tickets.id(ticketId);
  
  if (!ticket) return true; // If ticket doesn't exist, consider it sold out
  
  return ticket.soldQuantity >= ticket.availableQuantity;
};

// Method to calculate available tickets count
eventSchema.methods.getAvailableTickets = function(ticketId) {
  const ticket = this.tickets.id(ticketId);
  
  if (!ticket) return 0;
  
  return Math.max(0, ticket.availableQuantity - ticket.soldQuantity);
};

// Calculate the total event capacity and current attendance
eventSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'reviews',
    select: 'review rating user createdAt'
  });
  next();
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event; 