const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  helpful: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "approved",
  },
  response: {
    text: String,
    date: Date,
    byUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  stayDate: {
    type: Date,
  },
  tripType: {
    type: String,
    enum: [
      "Business",
      "Leisure",
      "Family",
      "Couple",
      "Solo",
      "Friends",
      "Other",
    ],
    default: "Leisure",
  },
});

// Index for fast lookups by hotel and by user
reviewSchema.index({ hotelId: 1, date: -1 });
reviewSchema.index({ userId: 1, date: -1 });

// Unique compound index to prevent duplicate reviews
reviewSchema.index({ hotelId: 1, userId: 1 }, { unique: true });

// Update hotel rating after review is saved
reviewSchema.post("save", async function () {
  const hotel = await mongoose.model("Hotel").findById(this.hotelId);
  if (hotel) {
    await hotel.calculateAverageRating();
  }
});

// Update hotel rating after review is deleted
reviewSchema.post("remove", async function () {
  const hotel = await mongoose.model("Hotel").findById(this.hotelId);
  if (hotel) {
    await hotel.calculateAverageRating();
  }
});

// Check if model exists before compiling
const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);

module.exports = Review;
