const mongoose = require("mongoose");

const FavoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    itemType: {
      type: String,
      enum: ["hotel", "tour", "restaurant", "service"],
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "itemModel",
    },
    itemModel: {
      type: String,
      required: true,
      enum: ["Hotel", "Tour", "Restaurant", "LocalService"],
      default: function () {
        switch (this.itemType) {
          case "hotel":
            return "Hotel";
          case "tour":
            return "Tour";
          case "restaurant":
            return "Restaurant";
          case "service":
            return "LocalService";
          default:
            return "Hotel";
        }
      },
    },
    addedOn: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index to ensure a user can only favorite an item once
FavoriteSchema.index({ user: 1, itemType: 1, itemId: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", FavoriteSchema);
