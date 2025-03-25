const mongoose = require('mongoose');

const ticketSelectionSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.ObjectId,
    required: [true, 'Ticket ID is required']
  },
  ticketName: {
    type: String,
    required: [true, 'Ticket name is required']
  },
  price: {
    type: Number,
    required: [true, 'Ticket price is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  }
});

const attendeeSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  phone: String,
  ticketType: {
    type: String,
    required: [true, 'Ticket type is required']
  },
  ticketId: {
    type: mongoose.Schema.ObjectId,
    required: [true, 'Ticket ID is required']
  },
  checkedIn: {
    type: Boolean,
    default: false
  },
  checkedInAt: Date,
  additionalInfo: Object // For any event-specific information
});

const eventBookingSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.ObjectId,
    ref: 'Event',
    required: [true, 'Booking must belong to an event']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a user']
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  tickets: [ticketSelectionSchema],
  attendees: [attendeeSchema],
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'cash', 'other'],
    default: 'credit_card'
  },
  paymentId: String,
  paymentDate: Date,
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'cancelled', 'completed'],
    default: 'pending'
  },
  confirmationCode: {
    type: String,
    unique: true
  },
  specialRequests: String,
  refundStatus: {
    type: String,
    enum: ['none', 'requested', 'partial', 'full'],
    default: 'none'
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundDate: Date,
  refundReason: String,
  updatedAt: {
    type: Date,
    default: Date.now
  },
  notes: String,
  cancellationReason: String
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
eventBookingSchema.index({ event: 1, user: 1 });
eventBookingSchema.index({ user: 1, status: 1 });
eventBookingSchema.index({ confirmationCode: 1 });

// Pre-save middleware to generate confirmation code
eventBookingSchema.pre('save', function(next) {
  // Only generate code if it's a new booking
  if (this.isNew) {
    // Generate a unique confirmation code (alphanumeric, 8 characters)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.confirmationCode = code;
  }
  
  this.updatedAt = Date.now();
  next();
});

// Update event attendance count when booking is confirmed
eventBookingSchema.post('save', async function() {
  if (this.status === 'confirmed') {
    try {
      const Event = mongoose.model('Event');
      const event = await Event.findById(this.event);
      
      if (event) {
        // Total number of attendees in this booking
        const totalAttendees = this.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
        
        // Update the event's currentAttendees count
        event.currentAttendees += totalAttendees;
        await event.save({ validateBeforeSave: false });
      }
    } catch (err) {
      console.error('Error updating event attendance count:', err);
    }
  }
});

// Populate the event and user data when querying
eventBookingSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'event',
    select: 'name startDate endDate location.name coverImage'
  }).populate({
    path: 'user',
    select: 'name email'
  });
  next();
});

// Virtual for checking if booking is cancellable
eventBookingSchema.virtual('isCancellable').get(function() {
  if (this.status === 'cancelled' || this.status === 'completed') {
    return false;
  }
  
  // Can't cancel if event has already started
  if (this.event && this.event.startDate) {
    const now = new Date();
    const eventStartDate = new Date(this.event.startDate);
    return now < eventStartDate;
  }
  
  return true;
});

// Virtual for formatted booking date
eventBookingSchema.virtual('formattedBookingDate').get(function() {
  return new Date(this.bookingDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Static method to get booking statistics for an event
eventBookingSchema.statics.getBookingStats = async function(eventId) {
  const stats = await this.aggregate([
    {
      $match: { 
        event: mongoose.Types.ObjectId(eventId),
        status: { $in: ['confirmed', 'completed'] }
      }
    },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        totalTickets: { 
          $sum: {
            $reduce: {
              input: '$tickets',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.quantity'] }
            }
          }
        }
      }
    }
  ]);
  
  return stats.length > 0 ? stats[0] : {
    totalBookings: 0,
    totalRevenue: 0,
    totalTickets: 0
  };
};

const EventBooking = mongoose.model('EventBooking', eventBookingSchema);

module.exports = EventBooking; 