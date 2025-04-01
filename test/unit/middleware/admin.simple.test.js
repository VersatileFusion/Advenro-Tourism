const { expect } = require('chai');
const sinon = require('sinon');

describe('Admin Middleware Tests', function() {
  let req, res, next;
  
  beforeEach(() => {
    // Mock request object
    req = {
      user: {}
    };
    
    // Mock response object
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };
    
    // Mock next function
    next = sinon.spy();
  });
  
  // Simple implementation of admin middleware
  const adminMiddleware = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    
    next();
  };

  it('should call next() if user is an admin', () => {
    req.user.role = 'admin';
    
    adminMiddleware(req, res, next);
    
    expect(next.calledOnce).to.be.true;
    expect(res.status.called).to.be.false;
  });
  
  it('should return 403 if user is not an admin', () => {
    req.user.role = 'user';
    
    adminMiddleware(req, res, next);
    
    expect(next.called).to.be.false;
    expect(res.status.calledWith(403)).to.be.true;
    expect(res.json.calledOnce).to.be.true;
    expect(res.json.firstCall.args[0]).to.have.property('message', 'Access denied. Admin role required.');
  });
  
  it('should return 401 if no user in request', () => {
    req.user = null;
    
    adminMiddleware(req, res, next);
    
    expect(next.called).to.be.false;
    expect(res.status.calledWith(401)).to.be.true;
    expect(res.json.calledOnce).to.be.true;
    expect(res.json.firstCall.args[0]).to.have.property('message', 'Access denied. No token provided.');
  });
}); 