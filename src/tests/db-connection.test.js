const mongoose = require('mongoose');
const { expect } = require('./test-helper');

describe('Database Connection', () => {
    it('should connect to MongoDB', async () => {
        try {
            // Use a hardcoded test URI since TEST_DB_URI is not exported from test-helper
            const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/tourism-test-db';
            await mongoose.connect(testDbUri);
            expect(mongoose.connection.readyState).to.equal(1);
            await mongoose.disconnect();
        } catch (err) {
            console.error('MongoDB connection error:', err);
            throw err;
        }
    });
}); 