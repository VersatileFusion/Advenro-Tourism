const { expect } = require('chai');
const sinon = require('sinon');

describe('Error Handling Middleware Tests', function() {
  let req, res, next;
  let consoleErrorStub;
  
  beforeEach(() => {
    // Mock request object
    req = {
      accepts: sinon.stub()
    };
    
    // Mock response object
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
      sendFile: sinon.spy()
    };
    
    // Mock next function
    next = sinon.spy();
    
    // Stub console.error to prevent test output pollution
    consoleErrorStub = sinon.stub(console, 'error');
  });
  
  afterEach(() => {
    // Restore console.error
    consoleErrorStub.restore();
  });
  
  // Simple implementation of error middleware for testing
  const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err.stack);

    // Check if the request accepts HTML
    const acceptsHtml = req.accepts('html');

    // Handle HTML requests differently
    if (acceptsHtml) {
        // Determine status code
        const statusCode = err.status || 500;
        
        // Serve appropriate error page
        if (statusCode === 404) {
            return res.status(404).sendFile('404.html', { root: './public' });
        } else {
            return res.status(500).sendFile('500.html', { root: './public' });
        }
    }

    // For API requests, return JSON responses
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: Object.values(err.errors).map(error => error.message)
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'Duplicate field value entered',
            errors: Object.keys(err.keyValue).map(key => `${key} already exists`)
        });
    }

    // JWT error
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }

    // Multer error
    if (err.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            message: 'File upload error',
            errors: [err.message]
        });
    }

    // Default error
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        errors: process.env.NODE_ENV === 'development' ? [err.stack] : undefined
    });
  };

  it('should handle HTML requests with 404 status', () => {
    // Setup
    req.accepts.withArgs('html').returns(true);
    const err = new Error('Not Found');
    err.status = 404;
    
    // Execute
    errorHandler(err, req, res, next);
    
    // Verify
    expect(res.status.calledWith(404)).to.be.true;
    expect(res.sendFile.calledWith('404.html', { root: './public' })).to.be.true;
    expect(consoleErrorStub.called).to.be.true;
  });
  
  it('should handle HTML requests with 500 status for other errors', () => {
    // Setup
    req.accepts.withArgs('html').returns(true);
    const err = new Error('Internal Server Error');
    
    // Execute
    errorHandler(err, req, res, next);
    
    // Verify
    expect(res.status.calledWith(500)).to.be.true;
    expect(res.sendFile.calledWith('500.html', { root: './public' })).to.be.true;
    expect(consoleErrorStub.called).to.be.true;
  });
  
  it('should handle Mongoose validation errors', () => {
    // Setup
    req.accepts.withArgs('html').returns(false);
    const err = new Error('Validation Error');
    err.name = 'ValidationError';
    err.errors = {
      field1: { message: 'Field1 is required' },
      field2: { message: 'Field2 is invalid' }
    };
    
    // Execute
    errorHandler(err, req, res, next);
    
    // Verify
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledOnce).to.be.true;
    
    const response = res.json.firstCall.args[0];
    expect(response.success).to.be.false;
    expect(response.message).to.equal('Validation error');
    expect(response.errors).to.include('Field1 is required');
    expect(response.errors).to.include('Field2 is invalid');
    expect(consoleErrorStub.called).to.be.true;
  });
  
  it('should handle Mongoose duplicate key errors', () => {
    // Setup
    req.accepts.withArgs('html').returns(false);
    const err = new Error('Duplicate Key Error');
    err.code = 11000;
    err.keyValue = { email: 'test@example.com' };
    
    // Execute
    errorHandler(err, req, res, next);
    
    // Verify
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledOnce).to.be.true;
    
    const response = res.json.firstCall.args[0];
    expect(response.success).to.be.false;
    expect(response.message).to.equal('Duplicate field value entered');
    expect(response.errors).to.include('email already exists');
    expect(consoleErrorStub.called).to.be.true;
  });
  
  it('should handle JWT errors', () => {
    // Setup
    req.accepts.withArgs('html').returns(false);
    const err = new Error('Invalid Token');
    err.name = 'JsonWebTokenError';
    
    // Execute
    errorHandler(err, req, res, next);
    
    // Verify
    expect(res.status.calledWith(401)).to.be.true;
    expect(res.json.calledOnce).to.be.true;
    
    const response = res.json.firstCall.args[0];
    expect(response.success).to.be.false;
    expect(response.message).to.equal('Invalid token');
    expect(consoleErrorStub.called).to.be.true;
  });
  
  it('should handle expired JWT errors', () => {
    // Setup
    req.accepts.withArgs('html').returns(false);
    const err = new Error('Token Expired');
    err.name = 'TokenExpiredError';
    
    // Execute
    errorHandler(err, req, res, next);
    
    // Verify
    expect(res.status.calledWith(401)).to.be.true;
    expect(res.json.calledOnce).to.be.true;
    
    const response = res.json.firstCall.args[0];
    expect(response.success).to.be.false;
    expect(response.message).to.equal('Token expired');
    expect(consoleErrorStub.called).to.be.true;
  });
  
  it('should handle Multer errors', () => {
    // Setup
    req.accepts.withArgs('html').returns(false);
    const err = new Error('File too large');
    err.name = 'MulterError';
    
    // Execute
    errorHandler(err, req, res, next);
    
    // Verify
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledOnce).to.be.true;
    
    const response = res.json.firstCall.args[0];
    expect(response.success).to.be.false;
    expect(response.message).to.equal('File upload error');
    expect(response.errors).to.include('File too large');
    expect(consoleErrorStub.called).to.be.true;
  });
  
  it('should handle default errors', () => {
    // Setup
    req.accepts.withArgs('html').returns(false);
    const err = new Error('Some random error');
    
    // Execute
    errorHandler(err, req, res, next);
    
    // Verify
    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledOnce).to.be.true;
    
    const response = res.json.firstCall.args[0];
    expect(response.success).to.be.false;
    expect(response.message).to.equal('Some random error');
    expect(consoleErrorStub.called).to.be.true;
  });
  
  it('should handle errors with custom status codes', () => {
    // Setup
    req.accepts.withArgs('html').returns(false);
    const err = new Error('Payment Required');
    err.status = 402;
    
    // Execute
    errorHandler(err, req, res, next);
    
    // Verify
    expect(res.status.calledWith(402)).to.be.true;
    expect(res.json.calledOnce).to.be.true;
    
    const response = res.json.firstCall.args[0];
    expect(response.success).to.be.false;
    expect(response.message).to.equal('Payment Required');
    expect(consoleErrorStub.called).to.be.true;
  });
}); 