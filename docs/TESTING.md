# Testing Guide

This guide explains how to write and run tests for the Tourism Booking API.

## Table of Contents

1. [Testing Setup](#testing-setup)
2. [Test Structure](#test-structure)
3. [Writing Tests](#writing-tests)
4. [Running Tests](#running-tests)
5. [Test Coverage](#test-coverage)
6. [Mocking](#mocking)
7. [Best Practices](#best-practices)

## Testing Setup

The project uses the following testing stack:
- Jest as the test runner
- Supertest for HTTP assertions
- MongoDB Memory Server for database testing

### Installation

All testing dependencies are included in package.json. After cloning the repository:

\`\`\`bash
npm install
\`\`\`

### Configuration

Test configuration is in \`src/config/test.env\`:

\`\`\`env
NODE_ENV=test
PORT=5000
MONGO_URI_TEST=mongodb://localhost:27017/tourism-test
\`\`\`

## Test Structure

Tests are organized by feature in the \`src/tests\` directory:

\`\`\`
src/
└── tests/
    ├── setup.js
    ├── auth.test.js
    ├── user.test.js
    ├── hotel.test.js
    ├── flight.test.js
    ├── tour.test.js
    ├── review.test.js
    └── booking.test.js
\`\`\`

## Writing Tests

### Test Template

Use this template for consistency:

\`\`\`javascript
const request = require('supertest');
const app = require('../server');
const Model = require('../models/Model');

describe('Feature', () => {
    beforeAll(async () => {
        // Setup before all tests
    });

    beforeEach(async () => {
        // Setup before each test
    });

    afterEach(async () => {
        // Cleanup after each test
    });

    afterAll(async () => {
        // Cleanup after all tests
    });

    describe('GET /api/endpoint', () => {
        it('should do something', async () => {
            // Arrange
            const testData = {};

            // Act
            const response = await request(app)
                .get('/api/endpoint')
                .send(testData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');
        });
    });
});
\`\`\`

### Testing Authentication

Example of testing protected routes:

\`\`\`javascript
describe('Protected Route', () => {
    it('should require authentication', async () => {
        const res = await request(app)
            .get('/api/v1/protected-route');
        
        expect(res.status).toBe(401);
    });

    it('should access with valid token', async () => {
        const token = generateTestToken();
        
        const res = await request(app)
            .get('/api/v1/protected-route')
            .set('Authorization', \`Bearer \${token}\`);
        
        expect(res.status).toBe(200);
    });
});
\`\`\`

### Testing File Uploads

Example of testing file uploads:

\`\`\`javascript
describe('File Upload', () => {
    it('should upload a file', async () => {
        const res = await request(app)
            .post('/api/v1/upload')
            .attach('file', '__tests__/fixtures/test-file.jpg');
        
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('filename');
    });
});
\`\`\`

## Running Tests

### All Tests

\`\`\`bash
npm test
\`\`\`

### Specific Test File

\`\`\`bash
npm test -- src/tests/user.test.js
\`\`\`

### Watch Mode

\`\`\`bash
npm test -- --watch
\`\`\`

### Coverage Report

\`\`\`bash
npm test -- --coverage
\`\`\`

## Test Coverage

We aim for:
- Statements: > 80%
- Branches: > 80%
- Functions: > 80%
- Lines: > 80%

### Checking Coverage

Coverage reports are generated in \`coverage/\` directory:
- HTML report: \`coverage/lcov-report/index.html\`
- Console summary after running tests with coverage

## Mocking

### External Services

Example of mocking email service:

\`\`\`javascript
jest.mock('../utils/sendEmail', () => ({
    sendEmail: jest.fn().mockResolvedValue(true)
}));
\`\`\`

### Database Calls

Example of mocking MongoDB calls:

\`\`\`javascript
jest.mock('../models/User', () => ({
    findById: jest.fn().mockResolvedValue({
        id: 'test-id',
        name: 'Test User'
    })
}));
\`\`\`

## Best Practices

1. **Test Organization**
   - Group related tests using \`describe\`
   - Use clear test descriptions
   - Follow AAA pattern (Arrange, Act, Assert)

2. **Test Independence**
   - Each test should be independent
   - Clean up after each test
   - Don't rely on test execution order

3. **Assertions**
   - Test both positive and negative cases
   - Verify status codes and response structure
   - Check error messages and validation

4. **Database Testing**
   - Use separate test database
   - Clean database between tests
   - Use transactions when possible

5. **Authentication Testing**
   - Test with and without authentication
   - Test different user roles
   - Verify token validation

6. **Error Handling**
   - Test error scenarios
   - Verify error messages
   - Check error status codes

7. **Performance**
   - Keep tests focused and minimal
   - Use appropriate timeouts
   - Mock external services

## Common Testing Scenarios

### Testing Pagination

\`\`\`javascript
it('should paginate results', async () => {
    // Create 15 test items
    await Promise.all(
        Array(15).fill().map((_, i) => 
            Item.create({ name: \`Item \${i}\` })
        )
    );

    const res = await request(app)
        .get('/api/v1/items?page=2&limit=10');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(5);
    expect(res.body.pagination.total).toBe(15);
});
\`\`\`

### Testing Search and Filters

\`\`\`javascript
it('should filter results', async () => {
    const res = await request(app)
        .get('/api/v1/hotels?minPrice=100&maxPrice=200');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                price: expect.any(Number)
            })
        ])
    );
});
\`\`\`

### Testing Validation

\`\`\`javascript
it('should validate required fields', async () => {
    const res = await request(app)
        .post('/api/v1/reviews')
        .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
}); 