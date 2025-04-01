/**
 * Template file for model tests
 * 
 * How to use this template:
 * 1. Copy this file to test/unit/models/[modelName].test.js
 * 2. Replace placeholders with actual values
 * 3. Implement test cases for your model methods
 */

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Import test setup
const { dbHelper } = require('../../config/setup');

// Import the model to test
// Use a different name to avoid mongoose model compilation errors
const ModelUnderTest = require('../../../src/models/[ModelName]');

describe('[ModelName] Model Tests', function() {
  // Setup hooks
  before(async function() {
    // Connect to test database if not already connected
    if (mongoose.connection.readyState !== 1) {
      await dbHelper.connect();
    }
  });

  after(async function() {
    // No need to disconnect here as the global after hook will handle it
  });

  beforeEach(async function() {
    // Clear the collection before each test
    await mongoose.connection.collections['[collectionName]'].deleteMany({});
  });

  afterEach(function() {
    // Clean up after each test
    sinon.restore();
  });

  // Test model initialization
  describe('Model Schema', () => {
    it('should exist as a model', () => {
      expect(ModelUnderTest).to.be.a('function');
      expect(ModelUnderTest.modelName).to.equal('[ModelName]');
    });

    it('should have the correct fields', () => {
      const schema = ModelUnderTest.schema.obj;
      
      // Check schema fields
      expect(schema).to.have.property('name');
      // Add more field checks
    });
  });

  // Test model validation
  describe('Validation', () => {
    it('should validate required fields', async () => {
      try {
        const model = new ModelUnderTest({});
        await model.validate();
        expect.fail('Validation should have failed');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.errors).to.have.property('name');
        expect(error.errors.name.kind).to.equal('required');
      }
    });

    it('should validate field types', async () => {
      const model = new ModelUnderTest({
        name: 'Test Model',
        // Add other required fields
      });

      // Set an invalid type
      model.someNumberField = 'not a number';

      try {
        await model.validate();
        expect.fail('Validation should have failed');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.errors).to.have.property('someNumberField');
        expect(error.errors.someNumberField.name).to.equal('CastError');
      }
    });
  });

  // Test model instance methods
  describe('Instance Methods', () => {
    it('should have a toJSON method that transforms the document', () => {
      const model = new ModelUnderTest({
        name: 'Test Model',
        // Add other required fields
      });
      
      const json = model.toJSON();
      
      expect(json).to.be.an('object');
      expect(json).to.have.property('id');
      expect(json).to.not.have.property('__v');
    });

    it('should have custom instance methods that work as expected', () => {
      const model = new ModelUnderTest({
        name: 'Test Model',
        // Add other required fields
      });
      
      // Test any custom methods
      // expect(model.customMethod()).to.equal(expectedValue);
    });
  });

  // Test model static methods
  describe('Static Methods', () => {
    it('should have static methods that work as expected', async () => {
      // Create test data
      await ModelUnderTest.create({
        name: 'Test Model 1',
        // Add other required fields
      });
      
      // Test static methods
      const result = await ModelUnderTest.findByName('Test Model 1');
      expect(result).to.be.an('object');
      expect(result.name).to.equal('Test Model 1');
    });
  });

  // Test CRUD operations
  describe('CRUD Operations', () => {
    it('should create a document successfully', async () => {
      const data = {
        name: 'Test Model',
        // Add other required fields
      };
      
      const model = await ModelUnderTest.create(data);
      
      expect(model).to.be.an('object');
      expect(model.name).to.equal(data.name);
      expect(model._id).to.exist;
    });

    it('should read a document successfully', async () => {
      // Create test data
      const created = await ModelUnderTest.create({
        name: 'Test Model',
        // Add other required fields
      });
      
      // Read the data
      const found = await ModelUnderTest.findById(created._id);
      
      expect(found).to.be.an('object');
      expect(found.name).to.equal('Test Model');
      expect(found._id.toString()).to.equal(created._id.toString());
    });

    it('should update a document successfully', async () => {
      // Create test data
      const created = await ModelUnderTest.create({
        name: 'Test Model',
        // Add other required fields
      });
      
      // Update the data
      const updated = await ModelUnderTest.findByIdAndUpdate(
        created._id,
        { name: 'Updated Model' },
        { new: true }
      );
      
      expect(updated).to.be.an('object');
      expect(updated.name).to.equal('Updated Model');
      expect(updated._id.toString()).to.equal(created._id.toString());
    });

    it('should delete a document successfully', async () => {
      // Create test data
      const created = await ModelUnderTest.create({
        name: 'Test Model',
        // Add other required fields
      });
      
      // Delete the data
      await ModelUnderTest.findByIdAndDelete(created._id);
      
      // Verify deletion
      const found = await ModelUnderTest.findById(created._id);
      expect(found).to.be.null;
    });
  });
}); 