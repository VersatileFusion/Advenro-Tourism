const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Import the controller
const authController = require('../../../src/controllers/authController');

// Import models
const { User } = require('../../../src/models');
const ErrorResponse = require('../../../src/utils/errorResponse');
const sendEmail = require('../../../src/utils/sendEmail');

// Load test setup
require('../../config/setup');

describe('Auth Controller Tests', function() {
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
      password: 'hashedpassword123',
      role: 'user',
      getSignedJwtToken: sinon.stub().returns('testtoken123'),
      getResetPasswordToken: sinon.stub().returns('resettoken123'),
      matchPassword: sinon.stub().resolves(true),
      save: sinon.stub().resolves()
    };

    // Setup request, response, and next objects
    req = {
      body: {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123'
      },
      protocol: 'http',
      get: sinon.stub().returns('localhost:3000'),
      cookies: {},
      headers: {}
    };
    
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
      cookie: sinon.stub().returnsThis()
    };
    
    next = sinon.stub();

    // Stubs for User model methods
    sinon.stub(User, 'create').resolves(mockUser);
    sinon.stub(User, 'findOne').resolves(null);
    
    // Stub crypto for reset token
    sinon.stub(require('crypto'), 'randomBytes').returns({
      toString: sinon.stub().returns('randomtoken')
    });
    
    sinon.stub(require('crypto'), 'createHash').returns({
      update: sinon.stub().returns({
        digest: sinon.stub().returns('hashedtoken')
      })
    });
    
    // Stub other dependencies
    sinon.stub(sendEmail).resolves();
  });

  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      await authController.register(req, res, next);

      expect(User.create.calledOnce).to.be.true;
      expect(User.create.args[0][0]).to.deep.include({
        name: 'New User',
        email: 'new@example.com',
        password: 'password123'
      });
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('token');
    });

    it('should handle validation errors', async () => {
      // Set User.create to throw a validation error
      const validationError = new mongoose.Error.ValidationError();
      validationError.errors = { email: { message: 'Email is required' } };
      User.create.throws(validationError);

      await authController.register(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.be.instanceOf(ErrorResponse);
      expect(next.args[0][0].statusCode).to.equal(400);
    });

    it('should handle duplicate email error', async () => {
      // Set User.create to throw a duplicate key error
      const duplicateError = new Error('Duplicate key');
      duplicateError.code = 11000;
      User.create.throws(duplicateError);

      await authController.register(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.be.instanceOf(ErrorResponse);
      expect(next.args[0][0].statusCode).to.equal(400);
      expect(next.args[0][0].message).to.include('already exists');
    });

    it('should handle other server errors', async () => {
      User.create.throws(new Error('Server error'));

      await authController.register(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.be.instanceOf(Error);
    });
  });

  describe('login', () => {
    beforeEach(() => {
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      // Set User.findOne to return a user with password
      User.findOne.restore();
      sinon.stub(User, 'findOne').returns({
        select: sinon.stub().resolves(mockUser)
      });
    });
    
    it('should login successfully with valid credentials', async () => {
      await authController.login(req, res, next);

      expect(User.findOne.calledWith({ email: 'test@example.com' })).to.be.true;
      expect(mockUser.matchPassword.calledWith('password123')).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('token');
    });

    it('should return 400 if email or password is missing', async () => {
      req.body = { email: 'test@example.com' };

      await authController.login(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.be.instanceOf(ErrorResponse);
      expect(next.args[0][0].statusCode).to.equal(400);
    });

    it('should return 401 if user not found', async () => {
      User.findOne().select.resolves(null);

      await authController.login(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.be.instanceOf(ErrorResponse);
      expect(next.args[0][0].statusCode).to.equal(401);
    });

    it('should return 401 if password is incorrect', async () => {
      mockUser.matchPassword.resolves(false);

      await authController.login(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.be.instanceOf(ErrorResponse);
      expect(next.args[0][0].statusCode).to.equal(401);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      await authController.logout(req, res, next);

      expect(res.cookie.calledWith('token', 'none')).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.args[0][0].success).to.be.true;
    });
  });

  describe('forgotPassword', () => {
    beforeEach(() => {
      req.body = {
        email: 'test@example.com'
      };
      
      // Set User.findOne to return a user
      User.findOne.resolves(mockUser);
    });
    
    it('should send reset password email successfully', async () => {
      await authController.forgotPassword(req, res, next);

      expect(User.findOne.calledWith({ email: 'test@example.com' })).to.be.true;
      expect(mockUser.getResetPasswordToken.calledOnce).to.be.true;
      expect(mockUser.save.calledOnce).to.be.true;
      expect(sendEmail.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.args[0][0].success).to.be.true;
    });

    it('should return 404 if user not found', async () => {
      User.findOne.resolves(null);

      await authController.forgotPassword(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.be.instanceOf(ErrorResponse);
      expect(next.args[0][0].statusCode).to.equal(404);
    });

    it('should handle email sending error', async () => {
      sendEmail.throws(new Error('Email sending error'));

      await authController.forgotPassword(req, res, next);

      expect(mockUser.resetPasswordToken).to.be.undefined;
      expect(mockUser.resetPasswordExpire).to.be.undefined;
      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.be.instanceOf(ErrorResponse);
      expect(next.args[0][0].statusCode).to.equal(500);
    });
  });

  describe('resetPassword', () => {
    beforeEach(() => {
      req.params = {
        resettoken: 'resettoken123'
      };
      req.body = {
        password: 'newpassword123'
      };
      
      // Set User.findOne to return a user with valid reset token
      User.findOne.resolves(mockUser);
    });
    
    it('should reset password successfully', async () => {
      await authController.resetPassword(req, res, next);

      expect(mockUser.password).to.equal('newpassword123');
      expect(mockUser.resetPasswordToken).to.be.undefined;
      expect(mockUser.resetPasswordExpire).to.be.undefined;
      expect(mockUser.save.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('token');
    });

    it('should return 400 if token is invalid', async () => {
      User.findOne.resolves(null);

      await authController.resetPassword(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.be.instanceOf(ErrorResponse);
      expect(next.args[0][0].statusCode).to.equal(400);
    });
  });

  describe('getMe', () => {
    beforeEach(() => {
      req.user = {
        id: mockUser._id.toString()
      };
      
      // Set User.findById to return a user
      sinon.stub(User, 'findById').resolves(mockUser);
    });
    
    it('should get current user profile', async () => {
      await authController.getMe(req, res, next);

      expect(User.findById.calledWith(mockUser._id.toString())).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.args[0][0].data).to.deep.equal(mockUser);
    });

    it('should handle errors', async () => {
      User.findById.throws(new Error('Database error'));

      await authController.getMe(req, res, next);

      expect(next.calledOnce).to.be.true;
    });
  });

  describe('updateDetails', () => {
    beforeEach(() => {
      req.user = {
        id: mockUser._id.toString()
      };
      req.body = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };
      
      // Set User.findByIdAndUpdate to return updated user
      sinon.stub(User, 'findByIdAndUpdate').resolves({
        ...mockUser,
        name: 'Updated Name',
        email: 'updated@example.com'
      });
    });
    
    it('should update user details successfully', async () => {
      await authController.updateDetails(req, res, next);

      expect(User.findByIdAndUpdate.calledWith(
        mockUser._id.toString(),
        { name: 'Updated Name', email: 'updated@example.com' },
        { new: true, runValidators: true }
      )).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.args[0][0].data.name).to.equal('Updated Name');
    });

    it('should handle errors', async () => {
      User.findByIdAndUpdate.throws(new Error('Database error'));

      await authController.updateDetails(req, res, next);

      expect(next.calledOnce).to.be.true;
    });
  });

  describe('updatePassword', () => {
    beforeEach(() => {
      req.user = {
        id: mockUser._id.toString()
      };
      req.body = {
        currentPassword: 'password123',
        newPassword: 'newpassword123'
      };
      
      // Set User.findById to return user with password
      sinon.stub(User, 'findById').returns({
        select: sinon.stub().resolves(mockUser)
      });
    });
    
    it('should update password successfully', async () => {
      await authController.updatePassword(req, res, next);

      expect(User.findById.calledWith(mockUser._id.toString())).to.be.true;
      expect(mockUser.matchPassword.calledWith('password123')).to.be.true;
      expect(mockUser.save.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('token');
    });

    it('should return 401 if current password is incorrect', async () => {
      mockUser.matchPassword.resolves(false);

      await authController.updatePassword(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.be.instanceOf(ErrorResponse);
      expect(next.args[0][0].statusCode).to.equal(401);
    });

    it('should handle errors', async () => {
      User.findById().select.throws(new Error('Database error'));

      await authController.updatePassword(req, res, next);

      expect(next.calledOnce).to.be.true;
    });
  });
}); 