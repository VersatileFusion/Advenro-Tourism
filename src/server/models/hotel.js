const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
  },
  geoLocation: {
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  images: {
    type: [String],
    default: [],
  },
  amenities: {
    type: [String],
    default: [],
  },
  propertyType: {
    type: String,
    enum: ["Hotel", "Resort", "Apartment", "Villa", "Hostel", "Guesthouse"],
    default: "Hotel",
  },
  starRating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3,
  },
  checkInTime: {
    type: String,
    default: "14:00",
  },
  checkOutTime: {
    type: String,
    default: "12:00",
  },
  policies: {
    petsAllowed: {
      type: Boolean,
      default: false,
    },
    smokingAllowed: {
      type: Boolean,
      default: false,
    },
    cancellationPolicy: {
      type: String,
      default: "Flexible",
    },
  },
  contactDetails: {
    phone: String,
    email: String,
    website: String,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
hotelSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create a text index for search functionality
hotelSchema.index({
  name: "text",
  description: "text",
  city: "text",
  country: "text",
});

// Check if model exists before compiling
const Hotel = mongoose.models.Hotel || mongoose.model("Hotel", hotelSchema);

module.exports = Hotel;
