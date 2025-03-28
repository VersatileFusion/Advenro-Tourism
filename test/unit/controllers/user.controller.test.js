const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Import the controller
const userController = require('../../../src/controllers/userController');

// Import models
const { User } = require('../../../src/models');
const Newsletter = require('../../../src/models/newsletter');
const ErrorResponse = require('../../../src/utils/errorResponse');

// Mock dependencies
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../../../src/utils/sendEmail');

// Load test setup
require('../../config/setup');

describe('User Controller Tests', function() {
  this.timeout(10000);

  // Test data 
  let mockUser;
  let req, res, next;

  beforeEach(() => {
    // Create mock data
    mockUser = {
      _id: new ObjectId(),
      id: new ObjectId().toString(),
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword123',
      phone: '1234567890',
      address: '123 Test St',
      preferences: {
        notifications: true
      },
      emailVerified: true,
      role: 'user',
      getSignedJwtToken: sinon.stub().returns('testtoken123'),
      matchPassword: sinon.stub().resolves(true),
      getEmailVerificationToken: sinon.stub().returns('verificationtoken123'),
      save: sinon.stub().resolves()
    };

    // Setup request, response, and next objects
    req = {
      user: {
        id: mockUser._id.toString()
      },
      body: {},
      protocol: 'http',
      get: sinon.stub().returns('localhost:3000'),
      files: {},
      params: {}
    };
    
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
      cookie: sinon.stub().returnsThis()
    };
    
    next = sinon.stub();

    // Stub User model methods
    sinon.stub(User, 'findById').returns({
      populate: sinon.stub().resolves(mockUser),
      select: sinon.stub().resolves(mockUser)
    });
    sinon.stub(User, 'findByIdAndUpdate').resolves(mockUser);
    sinon.stub(User, 'findOne').resolves(null);
    
    // Stub other dependencies
    sinon.stub(sendEmail).resolves();
  });

  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });

  describe('getMe', () => {
    it('should get current user profile', async () => {
      await userController.getMe(req, res, next);

      expect(User.findById.calledWith(req.user.id)).to.be.true;
      expect(User.findById().populate.calledWith('bookings')).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
    });

    it('should handle errors', async () => {
      User.findById().populate.throws(new Error('Database error'));

      await userController.getMe(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.be.instanceOf(Error);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      req.body = {
        name: 'Updated Name',
        phone: '9876543210',
        address: 'New Address',
        preferences: { notifications: false }
      };

      await userController.updateProfile(req, res, next);

      expect(User.findByIdAndUpdate.calledOnce).to.be.true;
      expect(User.findByIdAndUpdate.args[0][0]).to.equal(req.user.id);
      expect(User.findByIdAndUpdate.args[0][1]).to.deep.include({
        name: 'Updated Name',
        phone: '9876543210'
      });
      expect(User.findByIdAndUpdate.args[0][2]).to.deep.equal({
        new: true,
        runValidators: true
      });
      expect(res.status.calledWith(200)).to.be.true;
    });

    it('should handle partial updates', async () => {
      req.body = {
        name: 'Updated Name'
      };

      await userController.updateProfile(req, res, next);

      expect(User.findByIdAndUpdate.calledOnce).to.be.true;
      expect(User.findByIdAndUpdate.args[0][1]).to.deep.include({ name: 'Updated Name' });
    });

    it('should handle errors', async () => {
      User.findByIdAndUpdate.throws(new Error('Database error'));

      await userController.updateProfile(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.be.instanceOf(Error);
    });
  });

  describe('updateEmail', () => {
    beforeEach(() => {
      req.body = {
        email: 'newemail@example.com',
        password: 'password123'
      };
    });
    
    it('should update email successfully', async () => {
      await userController.updateEmail(req, res, next);

      // Check if verification email was sent
      expect(mockUser.getEmailVerificationToken.calledOnce).to.be.true;
      expect(mockUser.save.called).to.be.true;
      expect(sendEmail.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
    });

    it('should return 400 if email or password is missing', async () => {
      req.body = { email: 'newemail@example.com' };

      await userController.updateEmail(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.be.instanceOf(ErrorResponse);
      expect(next.args[0][0].statusCode).to.equal(400);
    });

    it('should return 401 if password is incorrect', async () => {
      mockUser.matchPassword.resolves(false);

      await userController.updateEmail(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.be.instanceOf(ErrorResponse);
      expect(next.args[0][0].statusCode).to.equal(401);
    });

    it('should return 400 if email already exists', async () => {
      User.findOne.resolves({ email: 'existing@example.com' });

      await userController.updateEmail(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.be.instanceOf(ErrorResponse);
      expect(next.args[0][0].statusCode).to.equal(400);
    });

    it('should handle errors during email sending', async () => {
      sendEmail.throws(new Error('Email sending error'));

      await userController.updateEmail(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.be.instanceOf(ErrorResponse);
      expect(next.args[0][0].statusCode).to.equal(500);
    });
  });

  describe('verifyEmail', () => {
    beforeEach(() => {
      req.params.token = 'verificationtoken123';
      
      // Setup User.findOne for token verification
      User.findOne.restore();
      sinon.stub(User, 'findOne').resolves(mockUser);

      // Stub crypto
      sinon.stub(require('crypto'), 'createHash').returns({
        update: sinon.stub().returns({
          digest: sinon.stub().returns('hashedtoken123')
        })
      });
    });
    
    it('should verify email successfully', async () => {
      await userController.verifyEmail(req, res, next);

      expect(mockUser.save.calledOnce).to.be.true;
      expect(mockUser.emailVerified).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
    });

    it('should return 400 if token is invalid or expired', async () => {
      User.findOne.resolves(null);

      await userController.verifyEmail(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.be.instanceOf(ErrorResponse);
      expect(next.args[0][0].statusCode).to.equal(400);
    });
  });

  describe('updatePassword', () => {
    beforeEach(() => {
      req.body = {
        currentPassword: 'password123',
        newPassword: 'newpassword123'
      };
    });
    
    it('should update password successfully', async () => {
      await userController.updatePassword(req, res, next);

      expect(mockUser.matchPassword.calledWith(req.body.currentPassword)).to.be.true;
      expect(mockUser.save.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
    });

    it('should return 400 if passwords are missing', async () => {
      req.body = { currentPassword: 'password123' };

      await userController.updatePassword(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.be.instanceOf(ErrorResponse);
      expect(next.args[0][0].statusCode).to.equal(400);
    });

    it('should return 401 if current password is incorrect', async () => {
      mockUser.matchPassword.resolves(false);

      await userController.updatePassword(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.be.instanceOf(ErrorResponse);
      expect(next.args[0][0].statusCode).to.equal(401);
    });
  });

  describe('uploadAvatar', () => {
    let mvStub;
    
    beforeEach(() => {
      // Set up file upload environment variable
      process.env.FILE_UPLOAD_PATH = './uploads';
      process.env.MAX_FILE_UPLOAD = 1000000;
      
      // Setup mock file
      mvStub = sinon.stub().callsFake((path, callback) => callback());
      req.files = {
        avatar: {
          name: 'test.jpg',
          mimetype: 'image/jpeg',
          size: 500000,
          mv: mvStub
        }
      };
    });
    
    it('should upload avatar successfully', async () => {
      await userController.uploadAvatar(req, res, next);

      expect(mvStub.calledOnce).to.be.true;
      expect(User.findByIdAndUpdate.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
    });

    it('should return 400 if no file is uploaded', async () => {
      req.files = null;

      await userController.uploadAvatar(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.be.instanceOf(ErrorResponse);
      expect(next.args[0][0].statusCode).to.equal(400);
    });

    it('should return 400 if file is not an image', async () => {
      req.files.avatar.mimetype = 'application/pdf';

      await userController.uploadAvatar(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.be.instanceOf(ErrorResponse);
      expect(next.args[0][0].statusCode).to.equal(400);
    });

    it('should return 400 if file is too large', async () => {
      req.files.avatar.size = 2000000;

      await userController.uploadAvatar(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.be.instanceOf(ErrorResponse);
      expect(next.args[0][0].statusCode).to.equal(400);
    });

    it('should handle file upload error', async () => {
      mvStub.callsFake((path, callback) => callback(new Error('Upload error')));

      await userController.uploadAvatar(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.be.instanceOf(ErrorResponse);
      expect(next.args[0][0].statusCode).to.equal(500);
    });
  });
}); 