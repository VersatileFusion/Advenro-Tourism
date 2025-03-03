const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const connectDB = require('./config/database');

// Load env vars
console.log('🔧 Loading environment variables...');
dotenv.config({ path: './src/config/config.env' });

// Connect to database
console.log('🔌 Connecting to MongoDB...');
connectDB();

// Route files
const auth = require('./routes/auth');
const hotels = require('./routes/hotels');
const flights = require('./routes/flights');
const tours = require('./routes/tours');
const bookings = require('./routes/bookings');
const users = require('./routes/users');
const reviews = require('./routes/reviews');
const bookingCom = require('./routes/bookingCom');

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Enable CORS
console.log('🌐 Enabling CORS...');
app.use(cors());

// Set security headers
console.log('🔒 Setting security headers...');
app.use(helmet());

// Rate limiting
console.log('⚡ Setting up rate limiting...');
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Compress responses
console.log('📦 Enabling response compression...');
app.use(compression());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Enabling development logging...');
    app.use(morgan('dev'));
}

// Swagger API Documentation
console.log('📚 Setting up Swagger API documentation...');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Tourism Booking API Documentation"
}));

// Welcome route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Tourism Booking API',
        documentation: '/api-docs',
        version: '1.0.0'
    });
});

// Mount routers
console.log('🛣️ Mounting API routes...');
app.use('/api/v1/auth', auth);
app.use('/api/v1/hotels', hotels);
app.use('/api/v1/flights', flights);
app.use('/api/v1/tours', tours);
app.use('/api/v1/bookings', bookings);
app.use('/api/v1/users', users);
app.use('/api/v1/booking', bookingCom);

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Server Error'
    });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`
    🚀 Server is running!
    🌍 Mode: ${process.env.NODE_ENV}
    🏃‍♂️ Port: ${PORT}
    📚 API Docs: http://localhost:${PORT}/api-docs
    `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error('❌ Unhandled Rejection:', err.message);
    // Close server & exit process
    server.close(() => process.exit(1));
}); 