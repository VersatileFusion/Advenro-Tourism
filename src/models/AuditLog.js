const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'CHANGE_ROLE', 'BAN_USER', 'SYSTEM_CONFIG', 'BULK_NOTIFICATION']
    },
    entityType: {
        type: String,
        required: true,
        enum: ['USER', 'TOUR', 'HOTEL', 'FLIGHT', 'BOOKING', 'REVIEW', 'SYSTEM', 'NOTIFICATION']
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    previousValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add indexes for better query performance
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

module.exports = { schema: auditLogSchema }; 