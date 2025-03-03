const dotenv = require('dotenv');
const path = require('path');

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