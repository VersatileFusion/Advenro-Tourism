const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const sinon = require('sinon');
const chai = require('chai');
const { MongoMemoryServer } = require('mongodb-memory-server');
const expect = chai.expect;

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../config/test.env') });

// Set test environment
process.env.NODE_ENV = 'test';

let mongod;

// Mock Redis
const redisMock = {
    get: sinon.stub(),
    set: sinon.stub(),
    setex: sinon.stub(),
    del: sinon.stub(),
    flushall: sinon.stub(),
    quit: sinon.stub(),
    on: sinon.stub(),
    connect: sinon.stub(),
    disconnect: sinon.stub()
};

// Mock nodemailer
const nodemailerMock = {
    createTransport: sinon.stub().returns({
        sendMail: sinon.stub().resolves({ response: 'Success' })
    })
};

// Mock twilio
const twilioMock = {
    messages: {
        create: sinon.stub().resolves({ sid: 'test-sid' })
    }
};

// Mock web-push
const webPushMock = {
    setVapidDetails: sinon.stub(),
    sendNotification: sinon.stub().resolves()
};

// Mock file upload middleware
const fileUploadMock = (req, res, next) => {
    if (req.files) {
        req.files.avatar = {
            name: 'test-avatar.jpg',
            data: Buffer.from('test'),
            size: 1024,
            mimetype: 'image/jpeg'
        };
    }
    next();
};

// Global test helpers
global.createTestUser = async (userData = {}) => {
    const User = mongoose.model('User');
    const defaultUser = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
    };
    return await User.create({ ...defaultUser, ...userData });
};

global.generateAuthToken = async (user) => {
    return user.generateAuthToken();
};

// Database connection setup
const setupTestDB = async () => {
    console.log('🚀 Starting test suite');
    try {
        // Create an in-memory MongoDB instance
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        
        // Connect to the in-memory database
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to test database');
    } catch (error) {
        console.error('❌ Database connection error:', error);
        process.exit(1);
    }
};

// Database cleanup
const teardownTestDB = async () => {
    console.log('🏁 Cleaning up test suite');
    try {
        await mongoose.connection.close();
        if (mongod) {
            await mongod.stop();
        }
        console.log('✅ Disconnected from test database');
    } catch (error) {
        console.error('❌ Error closing database connection:', error);
    }
};

// Clear collections
const clearCollections = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany();
    }
    sinon.reset();
    console.log('🧹 Database cleared');
};

// Console methods for test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Export everything needed for tests
module.exports = {
    expect,
    redisMock,
    nodemailerMock,
    twilioMock,
    webPushMock,
    fileUploadMock,
    setupTestDB,
    teardownTestDB,
    clearCollections,
    originalConsoleError,
    originalConsoleWarn
}; 