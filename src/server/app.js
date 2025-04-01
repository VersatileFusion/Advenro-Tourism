const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const hotelRoutes = require('./routes/hotel');
const bookingRoutes = require('./routes/booking');
const reviewRoutes = require('./routes/review');
const paymentRoutes = require('./routes/payment');
const destinationRoutes = require('./routes/destination');
const newsletterRoutes = require('./routes/newsletter');

// Create a route handler for MongoDB hotels
const mongodbHotelsRoutes = express.Router();

// Define a simple hotel schema directly
const hotelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    location: { 
        address: { type: String, required: true },
        city: { type: String, required: true },
        country: { type: String, required: true },
        coordinates: { type: [Number], required: true }
    },
    amenities: [String],
    rating: { type: Number, default: 0 },
    images: [String],
    rooms: [{
        type: { type: String, required: true },
        price: { type: Number, required: true },
        capacity: { type: Number, required: true },
        available: { type: Boolean, default: true }
    }]
});

// Create the hotel model - using a try-catch to avoid "overwrite model" errors
let HotelModel;
try {
    HotelModel = mongoose.model('Hotel');
} catch (e) {
    HotelModel = mongoose.model('Hotel', hotelSchema);
}

// MongoDB Hotels routes
mongodbHotelsRoutes.get('/', async (req, res) => {
    try {
        console.log('🏨 Fetching all MongoDB hotels...');
        const { limit = 100 } = req.query;
        
        // Find all hotels
        const hotels = await HotelModel.find()
            .limit(Number(limit))
            .select('-__v'); // Exclude version field
            
        const total = await HotelModel.countDocuments();
        
        console.log(`✅ Found ${hotels.length} hotels in MongoDB`);
        
        res.json({
            success: true,
            count: hotels.length,
            total,
            data: hotels
        });
    } catch (error) {
        console.error('❌ Error fetching MongoDB hotels:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Search hotels
mongodbHotelsRoutes.post('/search', async (req, res) => {
    try {
        console.log('🔍 Searching MongoDB hotels...');
        const { city, minPrice, maxPrice, rating } = req.body;
        
        // Build query
        const query = {};
        if (minPrice) query.price = { $gte: minPrice };
        if (maxPrice) query.price = { ...query.price, $lte: maxPrice };
        if (city) query['location.city'] = new RegExp(city, 'i');
        if (rating) query.rating = { $gte: rating };
        
        // Find matching hotels
        const hotels = await HotelModel.find(query);
        
        console.log(`✅ Found ${hotels.length} hotels matching search criteria`);
        
        res.json({
            success: true,
            count: hotels.length,
            data: hotels
        });
    } catch (error) {
        console.error('❌ Error searching MongoDB hotels:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get nearby hotels
mongodbHotelsRoutes.get('/nearby', async (req, res) => {
    try {
        console.log('🗺️ Finding nearby hotels...');
        const { latitude, longitude, radius = 5000 } = req.query;
        
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }
        
        // Convert to numbers
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        
        // Simple proximity calculation (not using geospatial queries yet)
        // In a real app, you'd use MongoDB's $geoNear or $nearSphere
        const hotels = await HotelModel.find();
        
        // Crude distance calculation for demo purposes
        const nearbyHotels = hotels.filter(hotel => {
            // Skip hotels without proper location data
            if (!hotel.location || !hotel.location.coordinates || hotel.location.coordinates.length !== 2) {
                console.log('Skipping hotel without coordinates:', hotel.name);
                return false;
            }
            
            // Very basic distance calculation (for demo only)
            const hotelLng = hotel.location.coordinates[0];
            const hotelLat = hotel.location.coordinates[1];
            
            // Simple Euclidean distance (not accurate for geographic coordinates, just for demo)
            const distance = Math.sqrt(
                Math.pow(hotelLat - lat, 2) + 
                Math.pow(hotelLng - lng, 2)
            );
            
            // Arbitrary threshold for "nearby" (for demo purposes)
            return distance < 0.1;
        });
        
        console.log(`✅ Found ${nearbyHotels.length} hotels nearby`);
        
        res.json({
            success: true,
            count: nearbyHotels.length,
            data: nearbyHotels
        });
    } catch (error) {
        console.error('❌ Error finding nearby hotels:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get hotel by ID
mongodbHotelsRoutes.get('/:id', async (req, res) => {
    try {
        const hotel = await HotelModel.findById(req.params.id);
        
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }
        
        res.json({
            success: true,
            data: hotel
        });
    } catch (error) {
        console.error('Error getting hotel details:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get hotel reviews
mongodbHotelsRoutes.get('/:id/reviews', async (req, res) => {
    try {
        console.log('📝 Getting hotel reviews...');
        const hotelId = req.params.id;
        
        // Check if hotel exists
        const hotel = await HotelModel.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }
        
        // In a real app, you would fetch reviews from a Reviews collection
        // For demo purposes, we'll return an empty array
        res.json({
            success: true,
            count: 0,
            data: []
        });
    } catch (error) {
        console.error('Error getting hotel reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get hotel amenities
mongodbHotelsRoutes.get('/:id/amenities', async (req, res) => {
    try {
        console.log('🏨 Getting hotel amenities...');
        const hotelId = req.params.id;
        
        // Check if hotel exists
        const hotel = await HotelModel.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }
        
        // Return the hotel's amenities
        res.json({
            success: true,
            data: hotel.amenities || []
        });
    } catch (error) {
        console.error('Error getting hotel amenities:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get hotel availability
mongodbHotelsRoutes.get('/:id/availability', async (req, res) => {
    try {
        console.log('📅 Checking hotel availability...');
        const hotelId = req.params.id;
        const { checkIn, checkOut } = req.query;
        
        if (!checkIn || !checkOut) {
            return res.status(400).json({
                success: false,
                message: 'Check-in and check-out dates are required'
            });
        }
        
        // Check if hotel exists
        const hotel = await HotelModel.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }
        
        // In a real app, you would check room availability based on bookings
        // For demo purposes, we'll assume all rooms are available
        const availability = hotel.rooms && Array.isArray(hotel.rooms) 
            ? hotel.rooms.map(room => {
                // Convert to plain object without using toObject() 
                const plainRoom = {
                    type: room.type,
                    price: room.price,
                    capacity: room.capacity,
                    available: true
                };
                return plainRoom;
              })
            : []; // Return empty array if no rooms
        
        res.json({
            success: true,
            data: {
                hotel: hotel.name,
                checkIn,
                checkOut,
                availability
            }
        });
    } catch (error) {
        console.error('Error checking hotel availability:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Seed MongoDB with sample hotels - support both GET and POST
mongodbHotelsRoutes.route('/seed').get(seedHotels).post(seedHotels);

// Seed hotels handler function
async function seedHotels(req, res) {
    try {
        console.log(`🌱 Seeding hotels via ${req.method}...`);
        // Check if there are already hotels in the database
        const existingHotels = await HotelModel.countDocuments();
        
        if (existingHotels > 0) {
            return res.status(400).json({
                success: false,
                message: `Database already seeded with ${existingHotels} hotels`
            });
        }
        
        // Sample hotel data
        const sampleHotels = [
            {
                name: 'Grand Hotel New York',
                description: 'Luxury hotel in the heart of Manhattan',
                price: 299,
                location: {
                    address: '123 Broadway',
                    city: 'New York',
                    country: 'USA',
                    coordinates: [-74.0060, 40.7128]
                },
                amenities: ['Free WiFi', 'Swimming Pool', 'Spa', 'Gym', 'Restaurant'],
                rating: 4.7,
                images: ['/images/hotels/hotel1.jpg', '/images/hotels/hotel2.jpg'],
                rooms: [
                    {
                        type: 'Standard',
                        price: 299,
                        capacity: 2
                    },
                    {
                        type: 'Deluxe',
                        price: 399,
                        capacity: 3
                    },
                    {
                        type: 'Suite',
                        price: 599,
                        capacity: 4
                    }
                ]
            }
        ];
        
        // Create hotels
        const hotels = await HotelModel.create(sampleHotels);
        
        res.status(201).json({
            success: true,
            count: hotels.length,
            data: hotels,
            message: `Seeded ${hotels.length} hotels successfully`
        });
    } catch (error) {
        console.error('Error seeding hotels:', error);
        res.status(500).json({
            success: false,
            message: 'Error seeding hotels',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

const app = express();

// Connect to MongoDB only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tourism-booking', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));
} else {
  console.log('Test mode: Database connection handled by test setup');
}

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'", "https:", "http:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "http:"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'", "http://localhost:3000", "ws://localhost:3000"],
            fontSrc: ["'self'", "https:", "http:", "data:", "https://cdnjs.cloudflare.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false
})); // Security headers

// Enable CORS with specific options
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev')); // Logging
app.use(compression()); // Compress responses

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../../public')));

// Special handling for Stripe webhooks - needs raw body
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Parse JSON for all other routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/mongodb-hotels', mongodbHotelsRoutes);

// API Root route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start the server
const PORT = process.env.NODE_ENV === 'test' ? 3001 : (process.env.PORT || 3000);

// Only start the server if we're not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
} else {
  console.log('Server in test mode, not starting HTTP server');
}

// Add graceful shutdown handling
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  process.exit(0);
});

// Export the Express app
module.exports = app;