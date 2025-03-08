const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['SYSTEM', 'BOOKING', 'PAYMENT', 'ACCOUNT', 'MAINTENANCE', 'TOUR', 'HOTEL', 'FLIGHT']
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        default: 'MEDIUM'
    },
    status: {
        type: String,
        enum: ['PENDING', 'SENT', 'FAILED'],
        default: 'PENDING'
    },
    targetUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    scheduledFor: Date,
    expiresAt: Date,
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add indexes for better query performance
notificationSchema.index({ type: 1, status: 1 });
notificationSchema.index({ targetUsers: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ scheduledFor: 1 }, { sparse: true });

// Add method to mark notification as read
notificationSchema.methods.markAsRead = async function(userId) {
    if (!this.readBy.some(read => read.user.toString() === userId.toString())) {
        this.readBy.push({ user: userId });
        await this.save();
    }
    return this;
};

// Add static method to get unread notifications for a user
notificationSchema.statics.getUnreadForUser = function(userId) {
    return this.find({
        targetUsers: userId,
        'readBy.user': { $ne: userId }
    }).sort('-createdAt');
};

module.exports = { schema: notificationSchema }; 