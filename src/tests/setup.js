const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const redisClient = require('../config/redis');

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../config/test.env') });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock nodemailer
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ response: 'Success' })
    })
}));

// Mock twilio
jest.mock('twilio', () => () => ({
    messages: {
        create: jest.fn().mockResolvedValue({ sid: 'test-sid' })
    }
}));

// Mock web-push
jest.mock('web-push', () => ({
    setVapidDetails: jest.fn(),
    sendNotification: jest.fn().mockResolvedValue()
}));

// Mock file upload
jest.mock('express-fileupload', () => () => (req, res, next) => {
    if (req.files) {
        req.files.avatar = {
            name: 'test-avatar.jpg',
            mimetype: 'image/jpeg',
            size: 1024 * 1024, // 1MB
            mv: jest.fn().mockResolvedValue()
        };
    }
    next();
});

let mongoServer;

// Setup before all tests
beforeAll(async () => {
    // Setup MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Clear Redis cache
    await redisClient.flushall();
});

// Cleanup after all tests
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    await redisClient.quit();
});

// Clear database collections between tests
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany();
    }
});

// Global test helpers
global.createTestUser = async (userData = {}) => {
    const User = mongoose.model('User');
    const defaultUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
    };
    return await User.create({ ...defaultUser, ...userData });
};

global.generateAuthToken = async (user) => {
    return user.generateAuthToken();
};

// Mock Redis for testing
jest.mock('../config/redis', () => ({
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    flushall: jest.fn(),
    quit: jest.fn()
})); 