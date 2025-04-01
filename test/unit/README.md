# Simple Tests

This directory contains isolated tests that don't require database connections or complex setup.

## Simple Test Structure

Simple tests (`*.simple.test.js`) are standalone tests that validate core functionality without external dependencies:

- `models/*.simple.test.js` - Tests for data validation, calculations, and model behavior
- `middleware/*.simple.test.js` - Tests for authentication and other middleware functions
- `routes/*.simple.test.js` - Tests for API route handlers and controllers

## Running Simple Tests

```bash
# Run all simple tests
npm run test:simple

# Run a specific simple test
npx mocha test/unit/models/user.simple.test.js
```

## Key Simple Tests

1. **User Password Hashing** (`models/user.simple.test.js`)
   - Tests bcrypt password hashing functionality

2. **Auth Middleware** (`middleware/auth.simple.test.js`)
   - Tests JWT token validation in middleware 

3. **Hotel Validation** (`models/hotel.simple.test.js`)
   - Tests hotel schema validation rules

4. **Booking Logic** (`models/booking.simple.test.js`)
   - Tests date validation and price calculation

5. **API Routes** (`routes/api.simple.test.js`)
   - Tests authentication, hotel listings, and booking endpoints

## Best Practices

- Keep tests independent of each other
- Use descriptive test names
- Test both success and failure cases
- Focus on core business logic without database connections
- Use reliable mocks for external dependencies 