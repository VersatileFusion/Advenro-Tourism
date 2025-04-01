# Advenro Testing Guide

## Current Testing Status

We've successfully implemented a testing framework for the Advenro project with a focus on controller testing. Currently, the basic controller test validates that our controllers exist and expose the required functions.

## Running Tests

The project has several test scripts:

```
npm test               # Run all tests (currently has issues with model compilation)
npm run test:unit      # Run unit tests
npm run test:basic     # Run only the basic controller test (working)
npm run test:simple    # Run simple tests
npm run test:integration # Run integration tests
```

## Test Generator

We've added a test generator to help create new test files quickly:

```
npm run generate:test controller user   # Generate a controller test for userController
npm run generate:test model booking     # Generate a model test for Booking model
```

The generator creates a test file from a template with placeholders replaced for your specific component. After generating a test file, you should customize it for your specific needs.

## Current Issues

There are some challenges with the testing setup:

1. **Model Compilation Errors**: When running the full test suite, we encounter `OverwriteModelError: Cannot overwrite 'Booking' model once compiled`. This happens because models are being imported multiple times across different test files.

2. **Missing Dependencies**: Some tests require external modules like `multer` that might not be installed.

## Recent Improvements

We've implemented several enhancements to the testing framework:

1. **Database Cleaner Utility**: Added in `test/utils/db-cleaner.js` to clear the database between tests.
2. **Improved Test Setup**: Updated the test setup configuration in `test/config/setup.js`.
3. **Mock Models**: Replaced direct model imports with mock objects to prevent compilation errors.
4. **Test Template**: Created a controller test template in `test/templates/controller.test.template.js`
5. **Test Generator**: Added a script to generate tests from templates in `scripts/generate-test.js`

## Recommendations for Improvement

### 1. Use a Test Database Helper

Create a shared helper for database connections that:

- Connects to the test database before tests
- Disconnects after tests
- Provides a mechanism to clear collections between tests

### 2. Create Mocks for Models

Instead of importing real models in tests, use mock objects:

```javascript
// Mock examples
const UserMock = {
  findById: sinon.stub(),
  findOne: sinon.stub(),
  // Other methods
};

const BookingMock = {
  find: sinon.stub(),
  // Other methods
};
```

### 3. Implement Jest Mocking (Alternative)

Consider migrating to Jest for better mocking capabilities:

```javascript
// In Jest
jest.mock('../../../src/models', () => ({
  User: {
    findById: jest.fn(),
    findOne: jest.fn()
  },
  Booking: {
    find: jest.fn()
  }
}));
```

### 4. Singleton Pattern for Models

Refactor the models to use a singleton pattern to prevent multiple compilations:

```javascript
// In model file
let BookingModel;
module.exports = mongoose => {
  if (!BookingModel) {
    const schema = new mongoose.Schema({...});
    BookingModel = mongoose.model('Booking', schema);
  }
  return BookingModel;
};
```

### 5. Isolate Tests

Ensure each test file can run independently without depending on the state from other tests.

### 6. Use Test Fixtures

Create fixtures for test data to ensure consistency across tests:

```javascript
// fixtures/users.js
module.exports = {
  validUser: {
    name: 'Test User',
    email: 'test@example.com',
    // other properties
  }
  // other fixtures
};
```

## Implementing Controller Function Tests

To test controller functions, follow these steps:

### 1. Set up Mocks and Stubs

Create mocks for request, response, and next objects:

```javascript
// Set up mock request
const mockReq = {
  user: { id: 'user123' },
  body: { name: 'Updated Name' },
  params: { id: 'item123' }
};

// Set up mock response
const mockRes = {
  status: sinon.stub().returnsThis(),
  json: sinon.stub().returnsThis(),
  cookie: sinon.stub().returnsThis()
};

// Set up mock next function
const mockNext = sinon.stub();
```

### 2. Set up Model Stubs

Configure the model stubs to return the expected data:

```javascript
// Stub User.findById to return a user
sinon.stub(UserMock, 'findById').callsFake(() => {
  return {
    populate: sinon.stub().returns({
      _id: 'user123',
      name: 'Test User',
      email: 'test@example.com'
    })
  };
});
```

### 3. Call the Controller Function

Execute the controller function with the mock objects:

```javascript
// Call the controller function
await userController.getProfile(mockReq, mockRes, mockNext);
```

### 4. Verify the Response

Check that the response matches expectations:

```javascript
// Verify response
expect(mockRes.status.calledWith(200)).to.be.true;
expect(mockRes.json.calledOnce).to.be.true;

// Verify the response data
const responseData = mockRes.json.getCall(0).args[0];
expect(responseData.status).to.equal('success');
expect(responseData.data.user.name).to.equal('Test User');
```

### 5. Verify Error Handling

Test error scenarios by making the stub throw an error:

```javascript
// Make the model stub throw an error
UserMock.findById.throws(new Error('Database error'));

// Call the controller function
await userController.getProfile(mockReq, mockRes, mockNext);

// Verify error handling
expect(mockRes.status.calledWith(500)).to.be.true;
expect(mockRes.json.calledOnce).to.be.true;
expect(mockRes.json.getCall(0).args[0].status).to.equal('error');
```

## Example Test Case for User Controller

```javascript
describe('UserController', () => {
  // ... existing tests ...

  describe('getProfile function', () => {
    it('should return user profile when valid ID is provided', async () => {
      // Setup
      mockReq.params.id = mockUser._id.toString();
      
      UserMock.findById.callsFake(() => {
        return {
          populate: sinon.stub().returns(mockUser)
        };
      });
      
      // Execute
      await userController.getProfile(mockReq, mockRes, mockNext);
      
      // Assert
      expect(UserMock.findById.calledWith(mockUser._id.toString())).to.be.true;
      expect(mockRes.status.calledWith(200)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data.user).to.deep.equal(mockUser);
    });
    
    it('should return 404 when user not found', async () => {
      // Setup - make findById return null
      UserMock.findById.callsFake(() => {
        return {
          populate: sinon.stub().returns(null)
        };
      });
      
      // Execute
      await userController.getProfile(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockRes.status.calledWith(404)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('not found');
    });
    
    it('should handle server errors', async () => {
      // Setup - make findById throw an error
      UserMock.findById.throws(new Error('Database error'));
      
      // Execute
      await userController.getProfile(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockRes.status.calledWith(500)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('error');
    });
  });
});
```

## Next Steps

1. Fix model compilation issues by implementing mock models
2. Improve test isolation by clearing database between tests
3. Add more controller tests following the basic controller test pattern
4. Implement test fixtures for consistent test data

## Sample Implementation for Controller Test

The current approach in `basic.controller.test.js` works well for testing controller existence and function exports. To test actual controller functionality:

```javascript
it('getMe should return user profile', async () => {
  // Setup
  mockReq.user = { id: mockUser._id };
  UserMock.findById.returns({
    populate: sinon.stub().returns(mockUser)
  });
  
  // Execute
  await userController.getMe(mockReq, mockRes, mockNext);
  
  // Assert
  expect(mockRes.status.calledWith(200)).to.be.true;
  expect(mockRes.json.calledOnce).to.be.true;
  const response = mockRes.json.getCall(0).args[0];
  expect(response).to.have.property('user');
  expect(response.user.name).to.equal(mockUser.name);
});
``` 