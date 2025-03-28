const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const mongoose = require('mongoose');

// Create mock logging service
const loggingServiceMock = {
  info: sinon.stub(),
  error: sinon.stub(),
  warn: sinon.stub(),
  debug: sinon.stub()
};

// Mock the mongoose collection methods
const collectionMock = {
  createIndex: sinon.stub().resolves(),
  dropIndexes: sinon.stub().resolves(),
  indexes: sinon.stub().resolves([
    {
      name: '_id_',
      key: { _id: 1 },
      unique: true
    },
    {
      name: 'email_1',
      key: { email: 1 },
      unique: true
    }
  ]),
  dropIndex: sinon.stub().resolves(),
  validate: sinon.stub().resolves({ valid: true }),
  aggregate: sinon.stub().returns({
    toArray: sinon.stub().resolves([
      {
        name: 'email_1',
        accesses: {
          ops: [
            { since: new Date() }
          ]
        }
      }
    ])
  })
};

// Mock the mongoose connection
const connectionMock = {
  collection: sinon.stub().returns(collectionMock)
};

// Replace the mongoose connection with our mock
mongoose.connection = connectionMock;

// Create a mock for require to intercept certain module requires
const originalRequire = require;
global.require = function(module) {
  if (module === './loggingService') {
    return loggingServiceMock;
  }
  return originalRequire(module);
};

// Now import the service using the mocked require
const indexService = require('../../../src/services/indexService');

// Restore the original require
global.require = originalRequire;

describe('Index Service Tests', function() {
  // Setup hooks
  beforeEach(() => {
    // Reset all stubs
    sinon.restore();
    
    // Setup the connection mock
    connectionMock.collection = sinon.stub().returns(collectionMock);
    
    // Setup collection mock methods
    collectionMock.createIndex = sinon.stub().resolves();
    collectionMock.dropIndexes = sinon.stub().resolves();
    collectionMock.indexes = sinon.stub().resolves([
      {
        name: '_id_',
        key: { _id: 1 },
        unique: true
      },
      {
        name: 'email_1',
        key: { email: 1 },
        unique: true
      }
    ]);
    collectionMock.dropIndex = sinon.stub().resolves();
    collectionMock.validate = sinon.stub().resolves({ valid: true });
    collectionMock.aggregate = sinon.stub().returns({
      toArray: sinon.stub().resolves([
        {
          name: 'email_1',
          accesses: {
            ops: [
              { since: new Date() }
            ]
          }
        }
      ])
    });
    
    // Reset logging mocks
    loggingServiceMock.info = sinon.stub();
    loggingServiceMock.error = sinon.stub();
    loggingServiceMock.warn = sinon.stub();
    loggingServiceMock.debug = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  // Test the service's existence and functions
  describe('Service Initialization', () => {
    it('should exist and export expected functions', () => {
      expect(indexService).to.be.an('object');
      expect(indexService.createIndexes).to.be.a('function');
      expect(indexService.dropIndexes).to.be.a('function');
      expect(indexService.getIndexStats).to.be.a('function');
      expect(indexService.analyzeIndexUsage).to.be.a('function');
      expect(indexService.optimizeIndexes).to.be.a('function');
      expect(indexService.validateIndexes).to.be.a('function');
    });

    it('should have predefined index definitions', () => {
      expect(indexService.indexDefinitions).to.be.an('object');
      expect(indexService.indexDefinitions).to.have.property('users');
      expect(indexService.indexDefinitions).to.have.property('bookings');
      expect(indexService.indexDefinitions).to.have.property('tours');
      expect(indexService.indexDefinitions).to.have.property('reviews');
    });
  });

  // Test createIndexes
  describe('createIndexes Function', () => {
    it('should create indexes for all collections', async () => {
      // Call the service function
      await indexService.createIndexes();
      
      // Verify that the collection method was called for each defined collection
      expect(connectionMock.collection.callCount).to.equal(
        Object.keys(indexService.indexDefinitions).length
      );
      
      // Verify createIndex was called
      expect(collectionMock.createIndex.called).to.be.true;
      
      // Verify logging
      expect(loggingServiceMock.info.called).to.be.true;
    });

    it('should handle errors correctly', async () => {
      // Make createIndex throw an error
      const error = new Error('Test error');
      collectionMock.createIndex = sinon.stub().rejects(error);
      
      // Call the service function and check that it throws
      try {
        await indexService.createIndexes();
        // Should not reach here
        expect.fail('Should have thrown an error');
      } catch (e) {
        expect(e).to.equal(error);
        expect(loggingServiceMock.error.called).to.be.true;
      }
    });
  });

  // Test dropIndexes
  describe('dropIndexes Function', () => {
    it('should drop all indexes for a collection', async () => {
      // Call the service function
      await indexService.dropIndexes('users');
      
      // Verify that the collection method was called
      expect(connectionMock.collection.calledWith('users')).to.be.true;
      
      // Verify dropIndexes was called
      expect(collectionMock.dropIndexes.calledOnce).to.be.true;
      
      // Verify logging
      expect(loggingServiceMock.info.called).to.be.true;
    });

    it('should handle errors correctly', async () => {
      // Make dropIndexes throw an error
      const error = new Error('Test error');
      collectionMock.dropIndexes = sinon.stub().rejects(error);
      
      // Call the service function and check that it throws
      try {
        await indexService.dropIndexes('users');
        // Should not reach here
        expect.fail('Should have thrown an error');
      } catch (e) {
        expect(e).to.equal(error);
        expect(loggingServiceMock.error.called).to.be.true;
      }
    });
  });

  // Test getIndexStats
  describe('getIndexStats Function', () => {
    it('should return index stats for all collections', async () => {
      // Call the service function
      const stats = await indexService.getIndexStats();
      
      // Verify that the collection method was called for each defined collection
      expect(connectionMock.collection.callCount).to.equal(
        Object.keys(indexService.indexDefinitions).length
      );
      
      // Verify indexes was called
      expect(collectionMock.indexes.called).to.be.true;
      
      // Verify the returned stats structure
      expect(stats).to.be.an('object');
      for (const collectionName of Object.keys(indexService.indexDefinitions)) {
        expect(stats).to.have.property(collectionName);
        expect(stats[collectionName]).to.have.property('count');
        expect(stats[collectionName]).to.have.property('indexes');
      }
    });

    it('should handle errors correctly', async () => {
      // Make indexes throw an error
      const error = new Error('Test error');
      collectionMock.indexes = sinon.stub().rejects(error);
      
      // Call the service function and check that it throws
      try {
        await indexService.getIndexStats();
        // Should not reach here
        expect.fail('Should have thrown an error');
      } catch (e) {
        expect(e).to.equal(error);
        expect(loggingServiceMock.error.called).to.be.true;
      }
    });
  });

  // Test analyzeIndexUsage
  describe('analyzeIndexUsage Function', () => {
    it('should return index usage stats for a collection', async () => {
      // Call the service function
      const result = await indexService.analyzeIndexUsage('users');
      
      // Verify that the collection method was called
      expect(connectionMock.collection.calledWith('users')).to.be.true;
      
      // Verify aggregate was called
      expect(collectionMock.aggregate.calledOnce).to.be.true;
      
      // Verify logging
      expect(loggingServiceMock.info.called).to.be.true;
      
      // Check the result format
      expect(result).to.be.an('array');
      expect(result[0]).to.have.property('name');
      expect(result[0]).to.have.property('accesses');
    });

    it('should handle errors correctly', async () => {
      // Make aggregate throw an error
      const error = new Error('Test error');
      collectionMock.aggregate = sinon.stub().throws(error);
      
      // Call the service function and check that it throws
      try {
        await indexService.analyzeIndexUsage('users');
        // Should not reach here
        expect.fail('Should have thrown an error');
      } catch (e) {
        expect(e).to.equal(error);
        expect(loggingServiceMock.error.called).to.be.true;
      }
    });
  });

  // Test optimizeIndexes
  describe('optimizeIndexes Function', () => {
    it('should optimize indexes for a collection', async () => {
      // Setup mock to simulate an old index that should be dropped
      const monthAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
      
      collectionMock.aggregate = sinon.stub().returns({
        toArray: sinon.stub().resolves([
          {
            name: 'email_1',
            accesses: {
              ops: [
                { since: monthAgo }
              ]
            }
          }
        ])
      });
      
      // Call the service function
      await indexService.optimizeIndexes('users');
      
      // Verify that the collection method was called
      expect(connectionMock.collection.calledWith('users')).to.be.true;
      
      // Verify logging
      expect(loggingServiceMock.info.called).to.be.true;
    });

    it('should handle errors correctly', async () => {
      // Make indexes throw an error
      const error = new Error('Test error');
      collectionMock.indexes = sinon.stub().rejects(error);
      
      // Call the service function and check that it throws
      try {
        await indexService.optimizeIndexes('users');
        // Should not reach here
        expect.fail('Should have thrown an error');
      } catch (e) {
        expect(e).to.equal(error);
        expect(loggingServiceMock.error.called).to.be.true;
      }
    });
  });

  // Test validateIndexes
  describe('validateIndexes Function', () => {
    it('should validate indexes for a collection', async () => {
      // Call the service function
      const result = await indexService.validateIndexes('users');
      
      // Verify that the collection method was called
      expect(connectionMock.collection.calledWith('users')).to.be.true;
      
      // Verify validate was called
      expect(collectionMock.validate.calledOnce).to.be.true;
      
      // Verify logging
      expect(loggingServiceMock.info.called).to.be.true;
      
      // Check the result
      expect(result).to.have.property('valid', true);
    });

    it('should handle errors correctly', async () => {
      // Make validate throw an error
      const error = new Error('Test error');
      collectionMock.validate = sinon.stub().rejects(error);
      
      // Call the service function and check that it throws
      try {
        await indexService.validateIndexes('users');
        // Should not reach here
        expect.fail('Should have thrown an error');
      } catch (e) {
        expect(e).to.equal(error);
        expect(loggingServiceMock.error.called).to.be.true;
      }
    });
  });
}); 