const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      "Standard",
      "Deluxe",
      "Suite",
      "Family",
      "Executive",
      "Presidential",
    ],
    default: "Standard",
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    default: 2,
  },
  bedType: {
    type: String,
    enum: ["Single", "Double", "Queen", "King", "Twin"],
    default: "Queen",
  },
  amenities: {
    type: [String],
    default: ["Free WiFi", "TV", "Air Conditioning"],
  },
  images: {
    type: [String],
    default: [],
  },
  size: {
    type: Number, // in square meters/feet
    min: 0,
  },
  view: {
    type: String,
    enum: ["City", "Garden", "Ocean", "Pool", "Mountain", "No View"],
    default: "No View",
  },
  smoking: {
    type: Boolean,
    default: false,
  },
  available: {
    type: Boolean,
    default: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
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
roomSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Room", roomSchema);
