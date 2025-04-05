// Import routes
const authRoutes = require('./routes/auth.routes');
const bookingRoutes = require('./routes/bookings.routes');
const profileRoutes = require('./routes/profile.routes');
const restaurantRoutes = require('./routes/restaurants.routes');
const flightRoutes = require('./routes/flights.routes');
const tourRoutes = require('./routes/tours.routes');
const searchRoutes = require('./routes/search.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const uploadRoutes = require('./routes/uploads.routes');
const adminRoutes = require('./routes/admin.routes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api', profileRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes); 