const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const redisClient = require('../config/redis');
const { MongoMemoryServer } = require('mongodb-memory-server');
const sinon = require('sinon');
const chai = require('chai');
const { expect } = chai;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models/user');

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../config/test.env') });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock Redis
const mockRedis = {
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

// Mock Nodemailer
const mockNodemailer = {
  createTransport: sinon.stub().returns({
    sendMail: sinon.stub().resolves({ response: 'Success' })
  })
};

// Mock Twilio
const mockTwilio = sinon.stub().returns({
  messages: {
    create: sinon.stub().resolves({ sid: 'test-sid' })
  }
});

// Mock Web Push
const mockWebPush = {
  setVapidDetails: sinon.stub(),
  sendNotification: sinon.stub().resolves()
};

// Mock Express File Upload
const mockFileUpload = () => (req, res, next) => {
  req.files = {
    file: {
      name: 'test.jpg',
      data: Buffer.from('test'),
      size: 1024,
      mimetype: 'image/jpeg',
      mv: sinon.stub().resolves()
    }
  };
  next();
};

// Replace actual modules with mocks
const proxyquire = require('proxyquire').noCallThru();

proxyquire('../config/redis', {
  'ioredis': function() { return mockRedis; }
});

proxyquire('nodemailer', mockNodemailer);
proxyquire('twilio', mockTwilio);
proxyquire('web-push', mockWebPush);
proxyquire('express-fileupload', mockFileUpload);

// Suppress console output during tests
console.error = sinon.stub();
console.warn = sinon.stub();

// Test database setup
let mongoServer;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
  
  // Reset all stubs
  sinon.reset();
});

// Test helper functions
async function createTestUser(role = 'user') {
  const userData = {
    email: 'test@example.com',
    password: await bcrypt.hash('password123', 10),
    firstName: 'Test',
    lastName: 'User',
    role: role
  };
  
  return await User.create(userData);
}

function generateAuthToken(user) {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}

// Export test helpers and mocks
module.exports = {
  expect,
  createTestUser,
  generateAuthToken,
  mockRedis,
  mockNodemailer,
  mockTwilio,
  mockWebPush,
  mockFileUpload
}; 