const { expect } = require('chai');
const sinon = require('sinon');
const userValidationMiddleware = require('../../../src/middleware/userValidation');

describe('User Validation Middleware Tests', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: {}
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    next = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('validateUserRegistration', () => {
    it('should validate valid user registration data', () => {
      req.body = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'John Doe',
        phone: '+1234567890'
      };

      userValidationMiddleware.validateUserRegistration(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should reject invalid email format', () => {
      req.body = {
        email: 'invalid-email',
        password: 'Password123!',
        name: 'John Doe'
      };

      userValidationMiddleware.validateUserRegistration(req, res, next);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(next.called).to.be.false;
    });

    it('should reject weak password', () => {
      req.body = {
        email: 'test@example.com',
        password: 'weak',
        name: 'John Doe'
      };

      userValidationMiddleware.validateUserRegistration(req, res, next);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(next.called).to.be.false;
    });
  });

  describe('validateUserUpdate', () => {
    it('should validate valid user update data', () => {
      req.body = {
        name: 'John Doe Updated',
        phone: '+1987654321'
      };

      userValidationMiddleware.validateUserUpdate(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should reject invalid phone number format', () => {
      req.body = {
        phone: 'invalid-phone'
      };

      userValidationMiddleware.validateUserUpdate(req, res, next);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(next.called).to.be.false;
    });

    it('should allow partial updates', () => {
      req.body = {
        name: 'John Doe Updated'
      };

      userValidationMiddleware.validateUserUpdate(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });
  });

  describe('validatePasswordChange', () => {
    it('should validate valid password change request', () => {
      req.body = {
        currentPassword: 'CurrentPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'NewPass123!'
      };

      userValidationMiddleware.validatePasswordChange(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should reject mismatched passwords', () => {
      req.body = {
        currentPassword: 'CurrentPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'DifferentPass123!'
      };

      userValidationMiddleware.validatePasswordChange(req, res, next);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(next.called).to.be.false;
    });

    it('should reject weak new password', () => {
      req.body = {
        currentPassword: 'CurrentPass123!',
        newPassword: 'weak',
        confirmPassword: 'weak'
      };

      userValidationMiddleware.validatePasswordChange(req, res, next);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(next.called).to.be.false;
    });
  });

  describe('validateUserProfile', () => {
    it('should validate valid user profile data', () => {
      req.body = {
        bio: 'Software Developer',
        location: 'New York',
        preferences: {
          emailNotifications: true,
          smsNotifications: false
        }
      };

      userValidationMiddleware.validateUserProfile(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should reject invalid preferences format', () => {
      req.body = {
        preferences: 'invalid-preferences'
      };

      userValidationMiddleware.validateUserProfile(req, res, next);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(next.called).to.be.false;
    });

    it('should allow partial profile updates', () => {
      req.body = {
        bio: 'Updated bio'
      };

      userValidationMiddleware.validateUserProfile(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });
  });
}); 