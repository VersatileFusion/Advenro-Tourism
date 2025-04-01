# Advenro Test Suite

This directory contains the test suite for the Advenro application. It includes both unit tests and integration tests.

## Directory Structure

```
test/
├── config/             # Test configuration files
├── helpers/            # Helper functions for tests
├── integration/        # Integration tests
│   └── routes/         # API route tests
├── unit/               # Unit tests
│   └── controllers/    # Controller tests
└── README.md           # This file
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB running locally or remotely
- All npm dependencies installed (`npm install`)

### Environment Setup

Make sure you have the following environment variables set:

```
NODE_ENV=test
MONGO_URI=mongodb://localhost:27017/advenro-test
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
```

## Running Tests

### Unit Tests

To run all unit tests:

```bash
npm run test:unit
```

To run a specific unit test:

```bash
npx mocha test/unit/controllers/specific.test.js
```

### Integration Tests

To run all integration tests:

```bash
npm run test:integration
```

To run integration tests in sequence (recommended):

```bash
npm run test:integration:sequence
# or on Windows
scripts/run-tests.bat
```

## Creating New Tests

### Using the Test Generator

We provide a test generator script to create new tests with consistent patterns:

```bash
# To create a unit test for a controller
npm run generate:test -- --type=unit --name=Resource

# To create an integration test for a route
npm run generate:test -- --type=integration --name=Resource
```

Replace `Resource` with the name of your resource (e.g., Hotel, Flight, Tour).

### Manual Test Creation

When creating tests manually, follow these patterns:

1. **Unit Tests**: Focus on testing controller functions in isolation
   - Use mocks for models and dependencies
   - Test the interface (exposed functions)
   - Test behavior (return values, error handling)

2. **Integration Tests**: Test API routes end-to-end
   - Test with actual database connections
   - Include authentication flows
   - Test successful and unsuccessful scenarios
   - Verify proper status codes and response formats

## Best Practices

1. **Isolation**: Each test should run in isolation without depending on other tests
2. **Clean Up**: Always clean up created resources in your tests
3. **Mocking**: Use mocks and stubs for external dependencies
4. **Authentication**: Always test both authenticated and unauthenticated scenarios
5. **Error Cases**: Test error handling, not just happy paths
6. **Database**: Use the test database, never the production database

## Troubleshooting

### Common Issues

- **Port conflicts**: Make sure no other service is using port 3001 during tests
- **Database connection errors**: Verify MongoDB is running and accessible
- **Authentication failures**: Check JWT settings and token generation
- **Test timeouts**: Increase the timeout value for slow tests
- **Database clean-up**: Ensure tests clean up created resources

### Debugging

To run tests with more verbose output:

```bash
DEBUG=* npm run test
```

To run a specific test with debugging:

```bash
node --inspect-brk node_modules/.bin/mocha test/path/to/test.js
```

Then connect with Chrome DevTools for debugging.

## Contributing

When adding new tests:

1. Follow the existing patterns and naming conventions
2. Make sure tests are independent and do not affect other tests
3. Include tests for both success and error cases
4. Document any special setup required for your tests 