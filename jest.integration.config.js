const config = require('./jest.config');

module.exports = {
  ...config,
  testMatch: [
    '**/tests/integration/**/*.test.js'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setupIntegration.js'
  ],
  testTimeout: 30000
}; 