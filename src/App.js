/**
 * Main Express application file
 * Sets up routes, middleware, and server configuration
 */

const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import routes
const hotelRoutes = require('./routes/hotels');
const flightRoutes = require('./routes/flights');
const tourRoutes = require('./routes/tours');
const eventRoutes = require('./routes/events');
const restaurantRoutes = require('./routes/restaurants');
const localServiceRoutes = require('./routes/localServices');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');

// Create Express app
const app = express();

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Apply middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(compression());

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'code.jquery.com', 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'cdn.jsdelivr.net', 'res.cloudinary.com'],
        fontSrc: ["'self'", 'cdnjs.cloudflare.com'],
        connectSrc: ["'self'", 'api.mapbox.com', 'api.stripe.com'],
      },
    },
  })
);

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', apiLimiter);

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/v1/hotels', hotelRoutes);
app.use('/api/v1/flights', flightRoutes);
app.use('/api/v1/tours', tourRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/restaurants', restaurantRoutes);
app.use('/api/v1/local-services', localServiceRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Serve the main HTML file for all routes (client-side routing)
app.get('*', (req, res) => {
  // Skip API routes and static files
  if (req.url.startsWith('/api') || req.url.includes('.')) {
    return notFound(req, res);
  }
  
  // Serve the main HTML file
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app; 