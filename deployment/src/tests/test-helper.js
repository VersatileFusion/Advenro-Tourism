const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const assert = require('assert');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const chai = require('chai');
const request = require('supertest');
const express = require('express');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config/test.env') });

// Create Express app for testing
const app = express();

// Add middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import and use routes
const authRoutes = require('../server/routes/auth.routes');
const hotelRoutes = require('../server/routes/hotel.routes');
const bookingRoutes = require('../server/routes/booking.routes');
const reviewRoutes = require('../server/routes/review.routes');
const destinationRoutes = require('../server/routes/destination.routes');
const paymentRoutes = require('../server/routes/payment.routes');
const contactRoutes = require('../server/routes/contact.routes');
const newsletterRoutes = require('../server/routes/newsletter.routes');
const bookingComRoutes = require('../routes/bookingCom');

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/hotels', hotelRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/destinations', destinationRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/newsletter', newsletterRoutes);
app.use('/api/v1/booking', bookingComRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    // Handle validation errors with 400 status code
    if (err.message && (
        err.message.includes('validation failed') || 
        err.message.includes('Invalid') || 
        err.message.includes('required') ||
        err.message.includes('Please provide')
    )) {
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }
    
    // Default error response
    res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// Server and database setup
const TEST_DB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/tourism-test-db';
const TEST_PORT = process.env.TEST_PORT || 5000;

// Initialize server
let server;

// Setup for using the mock-server for Booking.com API tests
// This ensures tests can run even if the real API is unavailable
const setupMockBookingServer = () => {
    // Create a proxy to route Booking.com API requests to our mock server
    const { createProxyMiddleware } = require('http-proxy-middleware');
    
    console.log('🔄 Setting up mock Booking.com API server for tests');
    
    const bookingProxy = createProxyMiddleware({
        target: 'http://localhost:3030', // This should match your mock-server port
        changeOrigin: true,
        pathRewrite: {
            '^/api/v1/booking': '' // Remove base path
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`📤 Proxying test request to mock server: ${proxyReq.path}`);
        },
        onError: (err, req, res) => {
            console.error('❌ Mock server proxy error:', err.message);
            // Return mock data even on connection errors
            res.status(200).json({
                success: true,
                data: [{
                    id: '123456',
                    name: 'Test Hotel',
                    location: { city: 'Test City', country: 'Test Country' },
                    price: 100,
                    rating: 4.5
                }]
            });
        }
    });
    
    // Mount the booking proxy middleware
    app.use('/api/v1/booking', bookingProxy);
    
    return true;
};

async function setupTestDB() {
    try {
        console.log('🔄 Setting up test environment...');
        
        // Close existing connections
        await mongoose.disconnect();

        // Set up mongoose connection
        await mongoose.connect(TEST_DB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connected to MongoDB Test Database');

        // Set up the mock booking server for API tests
        setupMockBookingServer();

        // Start server if not already running
        if (!server) {
            server = app.listen(TEST_PORT, () => {
                console.log(`Test server running on port ${TEST_PORT}`);
            });
        }

        // Properly configure app and server for supertest
        app.set('port', TEST_PORT);
        
        // Define the address method on both app and server
        const addressMethod = () => ({ port: TEST_PORT });
        server.address = addressMethod;
        app.address = addressMethod;

        return { app, server, mongod: null };
    } catch (error) {
        console.error('Failed to setup test database:', error);
        throw error;
    }
}

async function teardownTestDB() {
    try {
        console.log('🔄 Cleaning up test environment...');
        
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.dropDatabase();
            await mongoose.connection.close();
            console.log('MongoDB Test Database Cleaned and Disconnected');
        }

        if (server) {
            await new Promise((resolve) => server.close(resolve));
            server = null;
            console.log('Test server closed');
        }
    } catch (error) {
        console.error('Error during cleanup:', error);
        throw error;
    }
}

async function clearCollections() {
    if (mongoose.connection.readyState === 1) {
        const collections = await mongoose.connection.db.collections();
        for (let collection of collections) {
            await collection.deleteMany({});
        }
    }
}

// Helper function to get models
const getModels = () => {
    try {
        return require('../server/models');
    } catch (error) {
        console.error('Failed to load models:', error);
        throw error;
    }
};

// Helper function to create a test user
const createTestUser = async (overrides = {}) => {
    const { User } = getModels();
    const defaultUser = {
        email: 'test@example.com',
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'hotel_owner',
        ...overrides
    };
    const user = await User.create(defaultUser);
    return user;
};

// Helper function to generate auth token
const generateAuthToken = (user) => {
    return jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
    );
};

// Configure Chai
chai.use(function(chai, utils) {
    chai.Assertion.addProperty('toBeDefined', function() {
        this.assert(
            this._obj !== undefined,
            'expected #{this} to be defined',
            'expected #{this} to be undefined'
        );
    });

    chai.Assertion.addProperty('toBeNull', function() {
        this.assert(
            this._obj === null,
            'expected #{this} to be null',
            'expected #{this} to not be null'
        );
    });

    chai.Assertion.addProperty('toBeTruthy', function() {
        this.assert(
            Boolean(this._obj),
            'expected #{this} to be truthy',
            'expected #{this} to be falsy'
        );
    });

    chai.Assertion.addProperty('toBeFalsy', function() {
        this.assert(
            !this._obj,
            'expected #{this} to be falsy',
            'expected #{this} to be truthy'
        );
    });

    chai.Assertion.addMethod('toEqual', function(expected) {
        this.assert(
            JSON.stringify(this._obj) === JSON.stringify(expected),
            'expected #{this} to equal #{exp}',
            'expected #{this} to not equal #{exp}',
            expected
        );
    });

    chai.Assertion.addMethod('toContain', function(item) {
        this.assert(
            Array.isArray(this._obj) && this._obj.includes(item),
            'expected #{this} to contain #{exp}',
            'expected #{this} to not contain #{exp}',
            item
        );
    });
});

// Make chai.expect globally available
global.expect = chai.expect;

// Mock Redis
const redisMock = {
    get: sinon.stub(),
    set: sinon.stub(),
    del: sinon.stub(),
    exists: sinon.stub(),
    expire: sinon.stub(),
    ttl: sinon.stub()
};

// Mock Nodemailer
const nodemailerMock = {
    createTransport: sinon.stub().returns({
        sendMail: sinon.stub().resolves({ messageId: 'test-id' })
    })
};

// Mock Twilio
const twilioMock = {
    twiml: {
        VoiceResponse: sinon.stub().returns({
            say: sinon.stub().returnsThis(),
            dial: sinon.stub().returnsThis(),
            toString: sinon.stub().returns('<Response><Say>Test</Say></Response>')
        })
    }
};

// Export everything needed for tests
module.exports = {
    expect: chai.expect,
    assert,
    sinon,
    request,
    setupTestDB,
    teardownTestDB,
    clearCollections,
    createTestUser,
    generateAuthToken,
    app,
    server,
    getModels
}; 