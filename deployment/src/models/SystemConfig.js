const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    allowNewRegistrations: {
        type: Boolean,
        default: true
    },
    maxLoginAttempts: {
        type: Number,
        default: 5
    },
    passwordExpiryDays: {
        type: Number,
        default: 90
    },
    sessionTimeoutMinutes: {
        type: Number,
        default: 60
    },
    backupSchedule: {
        type: String,
        default: '0 0 * * *' // Daily at midnight
    },
    emailNotifications: {
        type: Boolean,
        default: true
    },
    smsNotifications: {
        type: Boolean,
        default: false
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

// Add indexes for better query performance
systemConfigSchema.index({ updatedAt: -1 });

module.exports = { schema: systemConfigSchema }; 