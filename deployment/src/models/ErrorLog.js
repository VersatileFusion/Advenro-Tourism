const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['SERVER_ERROR', 'CLIENT_ERROR', 'VALIDATION_ERROR', 'AUTH_ERROR', 'PAYMENT_ERROR']
    },
    message: {
        type: String,
        required: true
    },
    stack: String,
    path: String,
    method: String,
    statusCode: Number,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    ipAddress: String,
    userAgent: String,
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 2592000 // 30 days TTL
    }
});

// Add indexes for better query performance
errorLogSchema.index({ type: 1, createdAt: -1 });
errorLogSchema.index({ statusCode: 1 });
errorLogSchema.index({ user: 1 });

module.exports = { schema: errorLogSchema }; 