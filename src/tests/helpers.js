const request = require('supertest');
const app = require('../server');
const { User } = require('../models');
const path = require('path');

/**
 * Create a test user and get auth token
 */
const createTestUserAndToken = async (userData = {}) => {
    const defaultUser = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'Password123!',
        role: 'user',
        subscribeNewsletter: false
    };

    const user = await User.create({ ...defaultUser, ...userData });
    const token = await user.getSignedJwtToken();
    
    // Ensure password is available for comparison in tests
    user.password = defaultUser.password;
    
    return { user, token };
};

/**
 * Clean up test files
 */
const cleanupTestFiles = async () => {
    const fs = require('fs').promises;
    const uploadDir = path.join(__dirname, '../../public/uploads/avatars');
    
    try {
        const files = await fs.readdir(uploadDir);
        await Promise.all(
            files
                .filter(file => file !== 'default-avatar.jpg')
                .map(file => fs.unlink(path.join(uploadDir, file)))
        );
    } catch (err) {
        // Ignore errors if directory doesn't exist
    }
};

/**
 * Create test image file
 */
const createTestImage = async () => {
    const fs = require('fs').promises;
    const testImagePath = path.join(__dirname, 'fixtures/test-avatar.jpg');
    const dir = path.dirname(testImagePath);

    try {
        await fs.mkdir(dir, { recursive: true });
        // Create a small test image
        const imageData = Buffer.from(
            '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
            'base64'
        );
        await fs.writeFile(testImagePath, imageData);
        return testImagePath;
    } catch (err) {
        console.error('Error creating test image:', err);
        throw err;
    }
};

/**
 * Create test text file
 */
const createTestTextFile = async () => {
    const fs = require('fs').promises;
    const testTextPath = path.join(__dirname, 'fixtures/test.txt');
    const dir = path.dirname(testTextPath);

    try {
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(testTextPath, 'This is a test text file');
        return testTextPath;
    } catch (err) {
        console.error('Error creating test text file:', err);
        throw err;
    }
};

module.exports = {
    createTestUserAndToken,
    cleanupTestFiles,
    createTestImage,
    createTestTextFile,
    app
}; 