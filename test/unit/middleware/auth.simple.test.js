const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const jwt = require('jsonwebtoken');

// Define a simple test auth middleware
const authMiddleware = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Verify token
      const decoded = jwt.verify(token, 'test-secret-key');
      
      // Add user from payload to request
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

describe('Auth Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    // Setup request, response and next function
    req = {
      headers: {}
    };
    
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    
    next = sinon.stub();
  });
  
  it('should call next() with valid token', () => {
    // Generate a test token
    const token = jwt.sign(
      { userId: '123456', role: 'user' },
      'test-secret-key',
      { expiresIn: '1h' }
    );
    
    // Set auth header
    req.headers.authorization = `Bearer ${token}`;
    
    authMiddleware(req, res, next);
    
    expect(next.calledOnce).to.be.true;
    expect(req.user).to.have.property('userId', '123456');
    expect(req.user).to.have.property('role', 'user');
  });
  
  it('should return 401 with no token', () => {
    authMiddleware(req, res, next);
    
    expect(res.status.calledWith(401)).to.be.true;
    expect(res.json.calledOnce).to.be.true;
    expect(next.called).to.be.false;
  });
  
  it('should return 401 with invalid token', () => {
    req.headers.authorization = 'Bearer invalid-token';
    
    authMiddleware(req, res, next);
    
    expect(res.status.calledWith(401)).to.be.true;
    expect(res.json.calledOnce).to.be.true;
    expect(next.called).to.be.false;
  });
}); 