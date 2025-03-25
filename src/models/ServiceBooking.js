const mongoose = require('mongoose');

const serviceBookingSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.ObjectId,
    ref: 'LocalService',
    required: [true, 'Booking must belong to a service']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a user']
  },
  date: {
    type: Date,
    required: [true, 'Booking date is required']
  },
  time: {
    type: String,
    required: [true, 'Booking time is required']
  },
  additionalRequests: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  price: {
    type: Number,
    required: [true, 'Booking must have a price']
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'cash', 'other'],
    default: 'credit_card'
  },
  paymentId: String,
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

// Indexes for faster queries
serviceBookingSchema.index({ service: 1, user: 1, date: 1 });
serviceBookingSchema.index({ user: 1, status: 1 });

// Automatically update the updated timestamp
serviceBookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Populate the service and user data when querying
serviceBookingSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'service',
    select: 'name category price image provider.name'
  }).populate({
    path: 'user',
    select: 'name email'
  });
  next();
});

// Virtual for formatted booking time
serviceBookingSchema.virtual('formattedDate').get(function() {
  return new Date(this.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Static method to get booking statistics
serviceBookingSchema.statics.getBookingStats = async function(serviceId) {
  const stats = await this.aggregate([
    {
      $match: { service: mongoose.Types.ObjectId(serviceId) }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$price' }
      }
    }
  ]);
  
  return stats;
};

const ServiceBooking = mongoose.model('ServiceBooking', serviceBookingSchema);

module.exports = ServiceBooking; 