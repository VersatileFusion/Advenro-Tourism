const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
const compression = require('compression');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const hotelRoutes = require('./routes/hotel.routes');
const bookingRoutes = require('./routes/booking.routes');
const paymentRoutes = require('./routes/payment.routes');
const reviewRoutes = require('./routes/review.routes');
const destinationRoutes = require('./routes/destination.routes');
const newsletterRoutes = require('./routes/newsletter.routes');
const contactRoutes = require('./routes/contact.routes');
const docsRoutes = require('./routes/docs.routes');
const bookingComRoutes = require('../routes/bookingCom');

// Create Express app
const app = express();

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "https:"],
            "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"]
        }
    }
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(compression());

// Database connection with optimized pooling
if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 100,
        minPoolSize: 10,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 10000,
        retryWrites: true,
        w: 'majority'
    });

    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'MongoDB connection error:'));
    db.once('open', () => {
        console.log('Connected to MongoDB with optimized pooling');
    });
}

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/hotels', hotelRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/destinations', destinationRoutes);
app.use('/api/v1/newsletter', newsletterRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/docs', docsRoutes);
app.use('/api/v1/booking', bookingComRoutes);

// Serve API documentation at root
app.get('/', (req, res) => {
    res.redirect('/api/v1/docs/api-docs');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Only start the server if not in test mode
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`API Documentation available at http://localhost:${PORT}/api/v1/docs/api-docs`);
    });
}

module.exports = app; 