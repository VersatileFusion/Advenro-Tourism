const chai = require('chai');
const expect = chai.expect;
const User = require('../../../src/server/models/User');
const mongoose = require('mongoose');

// Load test setup
require('../../config/setup');

describe('User Model', function() {
  this.timeout(5000);
  
  describe('Schema Validation', () => {
    it('should create a valid user with all required fields', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User'
      };
      
      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser).to.have.property('_id');
      expect(savedUser.email).to.equal(userData.email);
      expect(savedUser.name).to.equal(userData.name);
      expect(savedUser.firstName).to.equal(userData.firstName);
      expect(savedUser.lastName).to.equal(userData.lastName);
      expect(savedUser.role).to.equal('user'); // Default role
    });
    
    it('should not create a user without required fields', async () => {
      const user = new User({
        // Missing required fields
      });
      
      try {
        await user.save();
        // If save succeeds, test should fail
        expect.fail('User should not be saved without required fields');
      } catch (error) {
        expect(error).to.exist;
        expect(error.name).to.equal('ValidationError');
        // Check for specific validation errors
        expect(error.errors).to.have.property('email');
        expect(error.errors).to.have.property('password');
      }
    });
    
    it('should not allow duplicate emails', async () => {
      // Create first user
      const firstUser = new User({
        email: 'duplicate@example.com',
        password: 'Password123!',
        name: 'First User',
        firstName: 'First',
        lastName: 'User'
      });
      
      await firstUser.save();
      
      // Try to create second user with same email
      const secondUser = new User({
        email: 'duplicate@example.com',
        password: 'AnotherPassword123!',
        name: 'Second User',
        firstName: 'Second',
        lastName: 'User'
      });
      
      try {
        await secondUser.save();
        // If save succeeds, test should fail
        expect.fail('User should not be saved with duplicate email');
      } catch (error) {
        expect(error).to.exist;
        expect(error.code).to.equal(11000); // Duplicate key error
      }
    });
  });
  
  describe('Password Handling', () => {
    it('should hash password when saving user', async () => {
      const plainPassword = 'TestPassword123!';
      const user = new User({
        email: 'password-test@example.com',
        password: plainPassword,
        name: 'Password Test',
        firstName: 'Password',
        lastName: 'Test'
      });
      
      await user.save();
      
      // Password should be hashed, not stored in plain text
      expect(user.password).to.not.equal(plainPassword);
      // Hashed passwords are typically long strings
      expect(user.password.length).to.be.gt(20); 
    });
    
    it('should correctly compare passwords', async () => {
      const plainPassword = 'ComparePassword123!';
      const user = new User({
        email: 'compare-test@example.com',
        password: plainPassword,
        name: 'Compare Test',
        firstName: 'Compare',
        lastName: 'Test'
      });
      
      await user.save();
      
      // Test correct password
      const isMatch = await user.comparePassword(plainPassword);
      expect(isMatch).to.be.true;
      
      // Test incorrect password
      const isWrongMatch = await user.comparePassword('WrongPassword123!');
      expect(isWrongMatch).to.be.false;
    });
  });
  
  describe('Token Generation', () => {
    it('should generate a valid auth token', async () => {
      const user = new User({
        email: 'token-test@example.com',
        password: 'TokenPassword123!',
        name: 'Token Test',
        firstName: 'Token',
        lastName: 'Test'
      });
      
      await user.save();
      
      const token = user.generateAuthToken();
      
      expect(token).to.be.a('string');
      // JWT tokens consist of three parts separated by dots
      expect(token.split('.')).to.have.lengthOf(3);
    });
  });
}); 