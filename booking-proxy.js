/**
 * Booking.com API Proxy Server
 * 
 * This server acts as a proxy between your application and the Booking.com API via RapidAPI.
 * It helps bypass regional restrictions by routing requests through a local server.
 * When the real API returns a 451 status code, it falls back to mock data.
 */

require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

// Create Express server
const app = express();
const PORT = process.env.PROXY_PORT || 3030;

// Your RapidAPI Key - replace this with your actual key or set it in .env file
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'c18dc1c71cmshe738c9bc9aea0e7p15936ejsn3ff9814630b2';

console.log('Starting proxy server with API Key:', RAPIDAPI_KEY ? '****' + RAPIDAPI_KEY.slice(-4) : 'Not Set');

// Enable CORS
app.use(cors());

// Request logging
app.use(morgan('dev'));

// Rate limiting to prevent abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', apiLimiter);

// Mock response for testing without hitting the real API
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Proxy server is running correctly',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!RAPIDAPI_KEY
  });
});

// Mock data directory - create if it doesn't exist
const mockDataDir = path.join(__dirname, 'mock-data');
if (!fs.existsSync(mockDataDir)) {
  fs.mkdirSync(mockDataDir);
}

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

// Save mock data to file
fs.writeFileSync(
  path.join(mockDataDir, 'hotel-search.json'),
  JSON.stringify(mockHotelSearch, null, 2)
);

// Mock data for hotel details
const mockHotelDetails = {
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
      ],
      reviews: [
        {
          id: 'review1',
          rating: 9.5,
          title: 'Perfect stay',
          comment: 'One of the best hotels I have ever stayed in.',
          date: '2024-01-20',
          reviewer: {
            name: 'Emma S.',
            country: 'Germany'
          }
        }
      ]
    }
  }
};

// Save mock hotel details to files
Object.entries(mockHotelDetails).forEach(([id, data]) => {
  fs.writeFileSync(
    path.join(mockDataDir, `hotel-${id}.json`),
    JSON.stringify(data, null, 2)
  );
});

// Handle locations search
const mockLocationsSearch = {
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

fs.writeFileSync(
  path.join(mockDataDir, 'locations.json'),
  JSON.stringify(mockLocationsSearch, null, 2)
);

// Direct mock endpoints (bypass proxy)
app.get('/api/v1/booking/direct/hotels/search', (req, res) => {
  console.log('🔍 Direct mock hotel search endpoint called with query:', req.query);
  res.json(mockHotelSearch);
});

app.get('/api/v1/booking/direct/hotels/:id', (req, res) => {
  const hotelId = req.params.id;
  console.log('🔍 Direct mock hotel details endpoint called for ID:', hotelId);
  
  if (mockHotelDetails[hotelId]) {
    res.json(mockHotelDetails[hotelId]);
  } else {
    res.status(404).json({
      success: false,
      error: 'Hotel not found',
      message: `No hotel found with ID: ${hotelId}`
    });
  }
});

app.get('/api/v1/booking/direct/locations', (req, res) => {
  console.log('🔍 Direct mock locations endpoint called with query:', req.query);
  res.json(mockLocationsSearch);
});

// Configure proxy middleware with fallback to mock data
const bookingApiProxy = createProxyMiddleware({
  target: 'https://booking-com.p.rapidapi.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/booking': '', // remove base path
  },
  headers: {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
  },
  onProxyReq: (proxyReq, req, res) => {
    // Log outgoing request
    console.log(`📤 Proxying request to: ${proxyReq.path}`);
    console.log(`   Query params: ${JSON.stringify(req.query)}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Log incoming response
    console.log(`📥 Received response: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
    
    // Handle blocked region (status code 451)
    if (proxyRes.statusCode === 451) {
      console.log('🔄 API access blocked due to regional restrictions, using mock data instead');
      
      // Get response data from mockedData based on the requested endpoint
      let mockResponseData = null;
      let statusCode = 200;
      
      // Extract the path without query parameters
      const urlPath = req.path.split('?')[0];
      
      if (urlPath.includes('/v1/hotels/search')) {
        mockResponseData = mockHotelSearch;
      } else if (urlPath.match(/\/v1\/hotels\/\d+/)) {
        const hotelId = urlPath.split('/').pop();
        if (mockHotelDetails[hotelId]) {
          mockResponseData = mockHotelDetails[hotelId];
        } else {
          statusCode = 404;
          mockResponseData = {
            success: false,
            error: 'Hotel not found',
            message: `No hotel found with ID: ${hotelId}`
          };
        }
      } else if (urlPath.includes('/v1/locations')) {
        mockResponseData = mockLocationsSearch;
      } else {
        statusCode = 404;
        mockResponseData = {
          success: false,
          error: 'Not Found',
          message: `No mock data available for: ${urlPath}`
        };
      }
      
      // Override the response with mock data
      res.statusCode = statusCode;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('X-Mock-Data', 'true');
      
      // Clear the original response
      res.removeHeader('transfer-encoding');
      if (res._header) {
        res._header = null;
      }
      
      // End the response with mock data
      res.end(JSON.stringify(mockResponseData));
      
      return;
    }
    
    // For debugging, you can log the full response body
    if (process.env.NODE_ENV === 'development') {
      let responseBody = '';
      proxyRes.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      proxyRes.on('end', () => {
        try {
          if (proxyRes.statusCode >= 400) {
            console.log(`❌ Error response: ${responseBody}`);
          } else if (responseBody.length < 1000) { // Only log smaller responses
            console.log(`✅ Response: ${responseBody}`);
          } else {
            console.log(`✅ Response received (${responseBody.length} bytes)`);
          }
        } catch (err) {
          console.error('Error parsing response body', err);
        }
      });
    }
  },
  onError: (err, req, res) => {
    console.error(`❌ Proxy error: ${err.message}`);
    
    // Use mock data as fallback for errors too
    console.log('🔄 API access error, using mock data instead');
    
    let mockResponseData = null;
    let statusCode = 200;
    
    // Extract the path without query parameters
    const urlPath = req.path.split('?')[0];
    
    if (urlPath.includes('/v1/hotels/search')) {
      mockResponseData = mockHotelSearch;
    } else if (urlPath.match(/\/v1\/hotels\/\d+/)) {
      const hotelId = urlPath.split('/').pop();
      if (mockHotelDetails[hotelId]) {
        mockResponseData = mockHotelDetails[hotelId];
      } else {
        statusCode = 404;
        mockResponseData = {
          success: false,
          error: 'Hotel not found',
          message: `No hotel found with ID: ${hotelId}`
        };
      }
    } else if (urlPath.includes('/v1/locations')) {
      mockResponseData = mockLocationsSearch;
    } else {
      statusCode = 404;
      mockResponseData = {
        success: false,
        error: 'Not Found',
        message: `No mock data available for: ${urlPath}`
      };
    }
    
    res.status(statusCode).json(mockResponseData);
  }
});

// Apply proxy middleware to all API routes
app.use('/api/v1/booking', bookingApiProxy);

// Fallback for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(`❌ Server error: ${err.message}`);
  res.status(500).json({
    success: false,
    error: 'Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Booking.com Proxy Server running on http://localhost:${PORT}`);
  console.log(`💡 Health check: http://localhost:${PORT}/health`);
  console.log(`💡 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`💡 API endpoint: http://localhost:${PORT}/api/v1/booking/v1/hotels/search?...`);
  console.log(`💡 Direct mock: http://localhost:${PORT}/api/v1/booking/direct/hotels/search`);
  console.log(`💡 Mock data directory: ${mockDataDir}`);
}); 