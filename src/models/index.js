const mongoose = require('mongoose');
const { schema: userSchema } = require('./User');
const { schema: tourSchema } = require('./Tour');
const { schema: hotelSchema } = require('./Hotel');
const { schema: flightSchema } = require('./Flight');
const { schema: bookingSchema } = require('./Booking');
const { schema: reviewSchema } = require('./Review');
const { schema: auditLogSchema } = require('./AuditLog');
const { schema: systemConfigSchema } = require('./SystemConfig');
const { schema: errorLogSchema } = require('./ErrorLog');
const { schema: notificationSchema } = require('./Notification');
const { schema: eventBookingSchema } = require('./EventBooking');
const { schema: eventSchema } = require('./Event');
const { schema: restaurantSchema } = require('./Restaurant');
const { schema: destinationSchema } = require('./Destination');
const { schema: localServiceSchema } = require('./LocalService');
const { schema: paymentSchema } = require('./Payment');

// Helper function to safely compile a model
const compileModel = (modelName, schema) => {
    try {
        // If the model exists, return it instead of recompiling
        return mongoose.models[modelName] || mongoose.model(modelName, schema);
    } catch (error) {
        // If it's an OverwriteModelError, return the existing model
        if (error.name === 'OverwriteModelError') {
            return mongoose.model(modelName);
        }
        // Otherwise, rethrow the error
        throw error;
    }
};

// Compile all models
const User = compileModel('User', userSchema);
const Tour = compileModel('Tour', tourSchema);
const Hotel = compileModel('Hotel', hotelSchema);
const Flight = compileModel('Flight', flightSchema);
const Booking = compileModel('Booking', bookingSchema);
const Review = compileModel('Review', reviewSchema);
const AuditLog = compileModel('AuditLog', auditLogSchema);
const SystemConfig = compileModel('SystemConfig', systemConfigSchema);
const ErrorLog = compileModel('ErrorLog', errorLogSchema);
const Notification = compileModel('Notification', notificationSchema);
const EventBooking = compileModel('EventBooking', eventBookingSchema);
const Event = compileModel('Event', eventSchema);
const Restaurant = compileModel('Restaurant', restaurantSchema);

// Export all models
module.exports = {
    User,
    Tour,
    Hotel,
    Flight,
    Booking,
    Review,
    AuditLog,
    SystemConfig,
    ErrorLog,
    Notification,
    EventBooking,
    Event,
    Restaurant
}; 