/**
 * @file Notification Model
 * @description Defines the schema for system notifications
 */

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NotificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "info",
        "warning",
        "success",
        "error",
        "promo",
        "booking",
        "payment",
        "account",
        "alert",
      ],
      default: "info",
    },
    read: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
      trim: true,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, type: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Notification = mongoose.model("Notification", NotificationSchema);

module.exports = Notification;
