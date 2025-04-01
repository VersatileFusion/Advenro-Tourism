const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const { authenticate } = require('../../../src/server/middleware/auth');
const User = require('../../../src/server/models/User');

// Load test setup
require('../../config/setup');

describe('Auth Middleware', function() {
  this.timeout(5000);
  
  let req, res, next;
  let token;
  let userId;
  
  // Create a test user and generate a token
  before(async () => {
    // Create test user
    const user = new User({
      email: 'middleware-test@example.com',
      password: 'Password123!',
      name: 'Middleware Test',
      firstName: 'Middleware',
      lastName: 'Test',
      role: 'user'
    });
    
    await user.save();
    userId = user._id;
    
    // Generate token
    token = jwt.sign(
      { id: userId, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
  });
  
  // Set up request, response and next function before each test
  beforeEach(() => {
    // Mock request object
    req = {
      header: sinon.stub()
    };
    
    // Mock response object
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    
    // Mock next function
    next = sinon.stub();
  });
  
  describe('Authentication Validation', () => {
    it('should pass with valid token in Authorization header', async () => {
      // Set token in headers
      req.header.withArgs('Authorization').returns(`Bearer ${token}`);
      
      // Call middleware
      await authenticate(req, res, next);
      
      // Check if middleware called next
      expect(next.calledOnce).to.be.true;
      
      // Check if user data is set in request
      expect(req.user).to.exist;
      expect(req.user._id.toString()).to.equal(userId.toString());
      expect(req.user.role).to.equal('user');
    });
    
    it('should fail without a token', async () => {
      // Set header to return null
      req.header.withArgs('Authorization').returns(undefined);
      
      // Call middleware
      await authenticate(req, res, next);
      
      // Check if middleware returned error
      expect(next.called).to.be.false;
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      // Check error message
      const responseArg = res.json.getCall(0).args[0];
      expect(responseArg).to.have.property('message');
      expect(responseArg.success).to.be.false;
    });
    
    it('should fail with invalid token format', async () => {
      // Set invalid token in headers
      req.header.withArgs('Authorization').returns('Bearer invalid-token');
      
      // Call middleware
      await authenticate(req, res, next);
      
      // Check if middleware returned error
      expect(next.called).to.be.false;
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      // Check error message
      const responseArg = res.json.getCall(0).args[0];
      expect(responseArg).to.have.property('message');
      expect(responseArg.success).to.be.false;
    });
    
    it('should fail with expired token', async () => {
      // Generate expired token
      const expiredToken = jwt.sign(
        { id: userId, role: 'user' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '0s' } // Expire immediately
      );
      
      // Wait a moment to ensure token expires
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Set expired token in headers
      req.header.withArgs('Authorization').returns(`Bearer ${expiredToken}`);
      
      // Call middleware
      await authenticate(req, res, next);
      
      // Check if middleware returned error
      expect(next.called).to.be.false;
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      // Check error message
      const responseArg = res.json.getCall(0).args[0];
      expect(responseArg).to.have.property('message');
      expect(responseArg.success).to.be.false;
    });
  });
}); 