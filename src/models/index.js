const mongoose = require('mongoose');
const { schema: userSchema } = require('./User');
const { schema: tourSchema } = require('./Tour');
const { schema: hotelSchema } = require('./Hotel');
const { schema: flightSchema } = require('./Flight');
const { schema: bookingSchema } = require('./Booking');
const { schema: reviewSchema } = require('./Review');

// Helper function to safely compile a model
const compileModel = (modelName, schema) => {
    return mongoose.models[modelName] || mongoose.model(modelName, schema);
};

// Compile all models
const User = compileModel('User', userSchema);
const Tour = compileModel('Tour', tourSchema);
const Hotel = compileModel('Hotel', hotelSchema);
const Flight = compileModel('Flight', flightSchema);
const Booking = compileModel('Booking', bookingSchema);
const Review = compileModel('Review', reviewSchema);

// Export all models
module.exports = {
    User,
    Tour,
    Hotel,
    Flight,
    Booking,
    Review
}; 