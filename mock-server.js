/**
 * Booking.com API Mock Server
 * 
 * This server provides mock responses that simulate the Booking.com API.
 * It's useful when you don't have access to the real API due to restrictions.
 */

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
const PORT = 3030;
const HOST = 'localhost';

// Enable CORS
app.use(cors());

// Add request logging
app.use(morgan('dev'));

// Add CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Mock data for hotel search
const mockHotelSearch = {
    success: true,
    count: 2,
    data: [
        {
            id: '123456',
            name: 'Mock Hotel London',
            location: {
                city: 'London',
                country: 'United Kingdom',
                address: '123 London Road',
                latitude: 51.5074,
                longitude: 0.1278
            },
            price: 150,
            currency: 'USD',
            rating: 8.7,
            stars: 4,
            images: ['https://example.com/hotel1.jpg'],
            description: 'A luxury hotel in the heart of London',
            amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant'],
            reviewCount: 123,
            checkIn: '14:00',
            checkOut: '11:00',
            hasAvailability: true
        },
        {
            id: '789012',
            name: 'Another Mock Hotel',
            location: {
                city: 'London',
                country: 'United Kingdom',
                address: '456 Baker Street',
                latitude: 51.5237,
                longitude: 0.1582
            },
            price: 200,
            currency: 'USD',
            rating: 9.2,
            stars: 5,
            images: ['https://example.com/hotel3.jpg'],
            description: 'A modern hotel in London with excellent amenities',
            amenities: ['WiFi', 'Gym', 'Bar', 'Restaurant'],
            reviewCount: 256,
            checkIn: '15:00',
            checkOut: '12:00',
            hasAvailability: true
        }
    ]
};

// Mock endpoint for hotel search - Booking.com original path
app.get('/v1/hotels/search', (req, res) => {
    console.log('🔍 Mock hotel search endpoint called with query:', req.query);
    
    // Add a small delay to simulate API latency
    setTimeout(() => {
        res.json(mockHotelSearch);
    }, 200);
});

// Mock endpoint for hotel search - our app path
app.get('/api/v1/booking/hotels/search', (req, res) => {
    console.log('🔍 Mock hotel search endpoint called with query:', req.query);
    
    // Add a small delay to simulate API latency
    setTimeout(() => {
        res.json(mockHotelSearch);
    }, 200);
});

// Mock data for hotel details
const hotelDetails = {
    '123456': {
        success: true,
        data: {
            id: '123456',
            name: 'Mock Hotel London',
            description: 'A luxury hotel in the heart of London',
            location: {
                city: 'London',
                country: 'United Kingdom',
                address: '123 London Road',
                latitude: 51.5074,
                longitude: 0.1278
            },
            price: 150,
            currency: 'USD',
            rating: 8.7,
            stars: 4,
            images: [
                'https://example.com/hotel1.jpg',
                'https://example.com/hotel2.jpg'
            ],
            amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant'],
            rooms: [
                {
                    id: 'room1',
                    name: 'Deluxe Room',
                    description: 'Spacious room with city view',
                    price: 150,
                    capacity: 2,
                    amenities: ['TV', 'Safe', 'Minibar']
                },
                {
                    id: 'room2',
                    name: 'Suite',
                    description: 'Luxury suite with separate living area',
                    price: 250,
                    capacity: 4,
                    amenities: ['TV', 'Safe', 'Minibar', 'Jacuzzi']
                }
            ],
            reviews: [
                {
                    id: 'review1',
                    rating: 9.0,
                    title: 'Excellent stay',
                    comment: 'We had a wonderful time at this hotel.',
                    date: '2023-12-15',
                    reviewer: {
                        name: 'John D.',
                        country: 'United States'
                    }
                }
            ]
        }
    },
    '789012': {
        success: true,
        data: {
            id: '789012',
            name: 'Another Mock Hotel',
            description: 'A modern hotel in London with excellent amenities',
            location: {
                city: 'London',
                country: 'United Kingdom',
                address: '456 Baker Street',
                latitude: 51.5237,
                longitude: 0.1582
            },
            price: 200,
            currency: 'USD',
            rating: 9.2,
            stars: 5,
            images: [
                'https://example.com/hotel3.jpg',
                'https://example.com/hotel4.jpg'
            ],
            amenities: ['WiFi', 'Gym', 'Bar', 'Restaurant'],
            rooms: [
                {
                    id: 'room1',
                    name: 'Standard Room',
                    description: 'Comfortable room with modern decor',
                    price: 200,
                    capacity: 2,
                    amenities: ['TV', 'Safe', 'Minibar']
                },
                {
                    id: 'room2',
                    name: 'Executive Suite',
                    description: 'Spacious suite with city view',
                    price: 350,
                    capacity: 2,
                    amenities: ['TV', 'Safe', 'Minibar', 'Work Desk']
                }
            ]
        }
    }
};

// Mock endpoint for hotel details - Booking.com original path
app.get('/v1/hotels/:id', (req, res) => {
    const hotelId = req.params.id;
    console.log('🔍 Mock hotel details endpoint called for ID:', hotelId);
    
    if (hotelDetails[hotelId]) {
        // Add a small delay to simulate API latency
        setTimeout(() => {
            res.json(hotelDetails[hotelId]);
        }, 200);
    } else {
        res.status(404).json({
            success: false,
            error: 'Hotel not found',
            message: `No hotel found with ID: ${hotelId}`
        });
    }
});

// Mock endpoint for hotel details - our app path
app.get('/api/v1/booking/hotels/:id', (req, res) => {
    const hotelId = req.params.id;
    console.log('🔍 Mock hotel details endpoint called for ID:', hotelId);
    
    if (hotelDetails[hotelId]) {
        // Add a small delay to simulate API latency
        setTimeout(() => {
            res.json(hotelDetails[hotelId]);
        }, 200);
    } else {
        res.status(404).json({
            success: false,
            error: 'Hotel not found',
            message: `No hotel found with ID: ${hotelId}`
        });
    }
});

// Mock data for locations
const mockLocations = {
    success: true,
    data: [
        {
            dest_id: 'London',
            name: 'London',
            country: 'United Kingdom',
            type: 'city'
        },
        {
            dest_id: 'Paris',
            name: 'Paris',
            country: 'France',
            type: 'city'
        },
        {
            dest_id: 'NewYork',
            name: 'New York',
            country: 'United States',
            type: 'city'
        }
    ]
};

// Mock endpoint for locations - Booking.com original path
app.get('/v1/locations', (req, res) => {
    console.log('🔍 Mock locations endpoint called with query:', req.query);
    
    // Add a small delay to simulate API latency
    setTimeout(() => {
        res.json(mockLocations);
    }, 200);
});

// Mock endpoint for locations - our app path
app.get('/api/v1/booking/locations', (req, res) => {
    console.log('🔍 Mock locations endpoint called with query:', req.query);
    
    // Add a small delay to simulate API latency
    setTimeout(() => {
        res.json(mockLocations);
    }, 200);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        mode: 'mock',
        timestamp: new Date().toISOString()
    });
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Mock server is running correctly',
        timestamp: new Date().toISOString()
    });
});

// Fallback for undefined routes
app.use((req, res) => {
    console.log('⚠️ Unknown route requested:', req.path);
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found. This is a mock server.`,
        available_endpoints: [
            '/v1/hotels/search',
            '/v1/hotels/:id',
            '/v1/locations',
            '/api/v1/booking/hotels/search',
            '/api/v1/booking/hotels/:id',
            '/api/v1/booking/locations',
            '/health',
            '/test'
        ]
    });
});

// Start the server
app.listen(PORT, HOST, () => {
    console.log(`🚀 Booking.com MOCK Server running on http://${HOST}:${PORT}`);
    console.log(`💡 Health check: http://${HOST}:${PORT}/health`);
    console.log(`💡 Test endpoint: http://${HOST}:${PORT}/test`);
    console.log(`💡 API endpoints:`);
    console.log(`   - http://${HOST}:${PORT}/v1/hotels/search`);
    console.log(`   - http://${HOST}:${PORT}/v1/hotels/:id`);
    console.log(`   - http://${HOST}:${PORT}/v1/locations`);
    console.log(`   - http://${HOST}:${PORT}/api/v1/booking/hotels/search`);
    console.log(`   - http://${HOST}:${PORT}/api/v1/booking/hotels/:id`);
    console.log(`   - http://${HOST}:${PORT}/api/v1/booking/locations`);
}); 