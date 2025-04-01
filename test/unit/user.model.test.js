const chai = require('chai');
const expect = chai.expect;
const mongoose = require('mongoose');
const User = require('../../src/server/models/User');

describe('User Model', () => {
  const testEmail = `test${Date.now()}@example.com`;
  let userId;

  before(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/advenro-test', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('Connected to MongoDB for testing');
    }
  });

  after(async () => {
    // Clean up the test database
    if (mongoose.connection.readyState === 1) {
      if (userId) {
        await User.findByIdAndDelete(userId);
      }
      console.log('Test data cleaned up');
    }
  });

  describe('User Creation', () => {
    it('should create a new user', async () => {
      const userData = {
        email: testEmail,
        password: 'Password123!',
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User'
      };

      const user = new User(userData);
      const savedUser = await user.save();
      
      userId = savedUser._id;
      
      expect(savedUser.email).to.equal(testEmail);
      expect(savedUser.name).to.equal('Test User');
      expect(savedUser.firstName).to.equal('Test');
      expect(savedUser.lastName).to.equal('User');
      expect(savedUser.password).to.not.equal('Password123!'); // Password should be hashed
    });

    it('should not allow duplicate emails', async () => {
      const userData = {
        email: testEmail,
        password: 'Password123!',
        name: 'Duplicate User',
        firstName: 'Duplicate',
        lastName: 'User'
      };

      const user = new User(userData);
      
      try {
        await user.save();
        // If save succeeds, test fails
        expect.fail('Expected error on duplicate email');
      } catch (error) {
        expect(error).to.exist;
        expect(error.name).to.equal('MongoServerError');
        expect(error.code).to.equal(11000); // Duplicate key error code
      }
    });
  });

  describe('Password Hashing', () => {
    it('should hash the password on save', async () => {
      const user = await User.findById(userId);
      expect(user.password).to.not.equal('Password123!');
      expect(user.password).to.be.a('string');
      expect(user.password.length).to.be.greaterThan(20); // Hashed passwords are typically long
    });

    it('should correctly validate passwords', async () => {
      const user = await User.findById(userId);
      
      // Test correct password
      const isMatch = await user.comparePassword('Password123!');
      expect(isMatch).to.be.true;
      
      // Test incorrect password
      const isWrongMatch = await user.comparePassword('WrongPassword!');
      expect(isWrongMatch).to.be.false;
    });
  });

  describe('JWT Token Generation', () => {
    it('should generate a valid JWT token', async () => {
      const user = await User.findById(userId);
      const token = user.generateAuthToken();
      
      expect(token).to.be.a('string');
      expect(token.split('.')).to.have.lengthOf(3); // JWT has 3 parts separated by dots
    });
  });
}); 