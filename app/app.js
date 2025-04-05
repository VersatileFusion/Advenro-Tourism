const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const WebSocketHandler = require('./websocket/WebSocketHandler');
const AuthService = require('./services/AuthService');
const bookingsController = require('./controllers/bookings.controller');
const notificationsController = require('./controllers/notifications.controller');
const errorHandler = require('./middleware/error.middleware');
const restaurantsRoutes = require('./routes/restaurants.routes');
const flightsRoutes = require('./routes/flights.routes');
const toursRoutes = require('./routes/tours.routes');
const adminRoutes = require('./routes/admin.routes');
const supportRoutes = require('./routes/support.routes');
const searchRoutes = require('./routes/search.routes');
const newsletterRoutes = require('./routes/newsletter.routes');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Use middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/bookings', require('./routes/bookings.routes'));
app.use('/api/payments', require('./routes/payments.routes'));
app.use('/api/hotels', require('./routes/hotels.routes'));
app.use('/api/reviews', require('./routes/reviews.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/local-services', require('./routes/local-services.routes'));
app.use('/api/events', require('./routes/events.routes'));
app.use('/api/notifications', require('./routes/notifications.routes'));
app.use('/api/uploads', require('./routes/uploads.routes'));
app.use('/api/tours', toursRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/restaurants', restaurantsRoutes);
app.use('/api/flights', flightsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/newsletter', newsletterRoutes);

// Error handler middleware
app.use(errorHandler);

// Fallback route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket handler with the auth service
const authService = new AuthService();
const webSocketHandler = new WebSocketHandler(server, authService);

// Connect WebSocket handler to controllers that need real-time updates
bookingsController.setWebSocketHandler(webSocketHandler);
notificationsController.setWebSocketHandler(webSocketHandler);

// Start server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 