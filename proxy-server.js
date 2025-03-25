const path = require('path');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');

// Set environment variables directly for testing
process.env.RAPIDAPI_KEY = 'c18dc1c71cmshe738c9bc9aea0e7p15936ejsn3ff9814630b2';
process.env.NODE_ENV = 'development';

const app = express();

// Debug: Print environment variables
console.log('Environment Variables:', {
    NODE_ENV: process.env.NODE_ENV,
    RAPIDAPI_KEY: process.env.RAPIDAPI_KEY ? '****' + process.env.RAPIDAPI_KEY.slice(-4) : undefined
});

// Configuration
const PORT = process.env.PROXY_PORT || 3001;
const HOST = 'localhost';
const API_URL = 'https://booking-com.p.rapidapi.com';

// Add request logging
app.use(morgan('dev'));

// Add CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log('📥 Incoming Request:', {
        method: req.method,
        path: req.path,
        query: req.query,
        headers: req.headers
    });
    next();
});

// Add mock endpoints BEFORE the proxy middleware
app.get('/api/v1/booking/mock', (req, res) => {
    console.log('🔍 Mock endpoint called with query:', req.query);
    res.json({
        success: true,
        data: [
            {
                id: '123456',
                name: 'Mock Hotel London',
                location: {
                    city: 'London',
                    country: 'United Kingdom'
                },
                price: 150,
                rating: 8.7,
                images: ['https://example.com/hotel1.jpg']
            }
        ]
    });
});

// Add mock endpoint for hotel details
app.get('/api/v1/booking/hotels/:id', (req, res, next) => {
    if (req.params.id === '123456') {
        console.log('🔍 Mock hotel details endpoint called for ID:', req.params.id);
        res.json({
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
                rating: 8.7,
                images: ['https://example.com/hotel1.jpg', 'https://example.com/hotel2.jpg'],
                amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant'],
                rooms: [
                    {
                        id: 'room1',
                        name: 'Deluxe Room',
                        description: 'Spacious room with city view',
                        price: 150,
                        capacity: 2
                    },
                    {
                        id: 'room2',
                        name: 'Suite',
                        description: 'Luxury suite with separate living area',
                        price: 250,
                        capacity: 4
                    }
                ]
            }
        });
        return;
    }
    
    // If not a mock ID, forward to the proxy
    next();
});

// Add mock endpoint for hotel search
app.get('/api/v1/booking/hotels/search', (req, res) => {
    console.log('🔍 Mock hotel search endpoint called with query:', req.query);
    res.json({
        success: true,
        count: 2,
        data: [
            {
                id: '123456',
                name: 'Mock Hotel London',
                location: {
                    city: 'London',
                    country: 'United Kingdom'
                },
                price: 150,
                rating: 8.7,
                images: ['https://example.com/hotel1.jpg']
            },
            {
                id: '789012',
                name: 'Another Mock Hotel',
                location: {
                    city: 'London',
                    country: 'United Kingdom'
                },
                price: 200,
                rating: 9.2,
                images: ['https://example.com/hotel3.jpg']
            }
        ]
    });
});

// Proxy configuration
const proxyOptions = {
    target: API_URL,
    changeOrigin: true,
    followRedirects: true,
    selfHandleResponse: false,
    pathRewrite: {
        '^/api/v1/booking': '/v1', // Remove the /api/v1/booking prefix when forwarding
    },
    onProxyReq: (proxyReq, req, res) => {
        // Add RapidAPI headers
        const apiKey = process.env.RAPIDAPI_KEY;
        if (!apiKey) {
            console.error('❌ RAPIDAPI_KEY not found in environment variables');
            res.status(500).json({
                success: false,
                error: 'API key not configured'
            });
            return;
        }

        proxyReq.setHeader('X-RapidAPI-Key', apiKey);
        proxyReq.setHeader('X-RapidAPI-Host', 'booking-com.p.rapidapi.com');
        
        // Log the proxied request
        console.log('📤 Proxying request:', {
            method: proxyReq.method,
            path: proxyReq.path,
            headers: proxyReq.getHeaders()
        });
    },
    onProxyRes: (proxyRes, req, res) => {
        // Log the proxy response
        console.log('📥 Proxy response:', {
            statusCode: proxyRes.statusCode,
            statusMessage: proxyRes.statusMessage,
            headers: proxyRes.headers
        });

        // Debug: Log response body for all responses
        let body = '';
        proxyRes.on('data', chunk => {
            body += chunk;
        });
        
        proxyRes.on('end', () => {
            try {
                console.log('📄 Response Body:', body);
                if (proxyRes.statusCode >= 400) {
                    console.error('❌ Error Response:', body);
                }
            } catch (err) {
                console.error('❌ Error processing response body:', err);
            }
        });
    },
    onError: (err, req, res) => {
        console.error('❌ Proxy Error:', err);
        // Try to send a response if headers haven't been sent yet
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: 'Proxy Error',
                message: err.message,
                stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
            });
        }
    }
};

// Create the proxy middleware
const bookingProxy = createProxyMiddleware(proxyOptions);

// Use the proxy for all remaining /api/v1/booking routes
app.use('/api/v1/booking', bookingProxy);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        environment: process.env.NODE_ENV,
        apiKeyConfigured: !!process.env.RAPIDAPI_KEY
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Express Error:', err);
    res.status(500).json({
        success: false,
        error: 'Server Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start the server
const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Proxy server is running on http://${HOST}:${PORT}`);
    console.log(`🌎 Environment: ${process.env.NODE_ENV}`);
});

// Handle server errors
server.on('error', (err) => {
    console.error('❌ Server Error:', err);
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
    }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
}); 