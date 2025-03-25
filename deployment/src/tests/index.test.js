const sinon = require('sinon');
const { setupTestDB, teardownTestDB, originalConsoleError, originalConsoleWarn } = require('./setup');

describe('Global Test Setup', () => {
    before(async () => {
        // Mock console methods for cleaner test output
        console.error = sinon.stub();
        console.warn = sinon.stub();
        
        // Setup test database
        await setupTestDB();
    });

    after(async () => {
        // Restore console methods
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        
        // Cleanup test database
        await teardownTestDB();
    });
}); 