const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Import models
const { User } = require('../../../src/models');
const ErrorResponse = require('../../../src/utils/errorResponse');

// Load test setup
require('../../config/setup');

describe('User Controller Simple Tests', function() {
  this.timeout(10000);

  // Test data 
  let mockUser;
  let req, res, next;

  beforeEach(() => {
    // Create mock data
    mockUser = {
      _id: new ObjectId(),
      name: 'Test User',
      email: 'test@example.com',
      save: function() { return Promise.resolve(this); }
    };

    // Setup request, response, and next objects
    req = {
      user: { id: mockUser._id.toString() },
      body: {}
    };
    
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    
    next = sinon.stub();

    // Stub User model methods
    sinon.stub(User, 'findById').returns({
      populate: sinon.stub().resolves(mockUser)
    });
  });

  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });

  describe('Stub Testing', () => {
    it('should properly setup and use stubs', async () => {
      // Just testing that the stubs are working
      expect(User.findById).to.be.a('function');
      expect(User.findById().populate).to.be.a('function');
      
      const result = await User.findById().populate();
      expect(result).to.deep.equal(mockUser);
      
      expect(res.status).to.be.a('function');
      res.status(200);
      expect(res.status.calledWith(200)).to.be.true;
      
      expect(next).to.be.a('function');
    });
  });
}); 