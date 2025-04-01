const { expect } = require('chai');
const sinon = require('sinon');
const { validationResult } = require('express-validator');
const validationMiddleware = require('../../../src/middleware/validation');

describe('Validation Middleware Tests', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {}
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

  describe('validateRequest', () => {
    it('should pass validation when no errors', () => {
      const mockValidationResult = {
        isEmpty: () => true,
        array: () => []
      };

      sinon.stub(validationResult, 'withDefaults').returns(mockValidationResult);

      validationMiddleware.validateRequest(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should return 400 when validation errors exist', () => {
      const mockValidationResult = {
        isEmpty: () => false,
        array: () => [
          { msg: 'Invalid email', param: 'email' },
          { msg: 'Password required', param: 'password' }
        ]
      };

      sinon.stub(validationResult, 'withDefaults').returns(mockValidationResult);

      validationMiddleware.validateRequest(req, res, next);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({
        errors: [
          { msg: 'Invalid email', param: 'email' },
          { msg: 'Password required', param: 'password' }
        ]
      })).to.be.true;
      expect(next.called).to.be.false;
    });
  });

  describe('validateUserInput', () => {
    it('should validate user registration input', () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
        name: 'John Doe'
      };

      validationMiddleware.validateUserInput(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should reject invalid email format', () => {
      req.body = {
        email: 'invalid-email',
        password: 'password123',
        name: 'John Doe'
      };

      validationMiddleware.validateUserInput(req, res, next);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(next.called).to.be.false;
    });

    it('should reject short password', () => {
      req.body = {
        email: 'test@example.com',
        password: '123',
        name: 'John Doe'
      };

      validationMiddleware.validateUserInput(req, res, next);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(next.called).to.be.false;
    });
  });

  describe('validateBookingInput', () => {
    it('should validate booking creation input', () => {
      req.body = {
        hotelId: 'hotel123',
        checkIn: '2024-04-01',
        checkOut: '2024-04-05',
        guests: 2
      };

      validationMiddleware.validateBookingInput(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should reject invalid dates', () => {
      req.body = {
        hotelId: 'hotel123',
        checkIn: '2024-04-05',
        checkOut: '2024-04-01',
        guests: 2
      };

      validationMiddleware.validateBookingInput(req, res, next);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(next.called).to.be.false;
    });

    it('should reject invalid guest count', () => {
      req.body = {
        hotelId: 'hotel123',
        checkIn: '2024-04-01',
        checkOut: '2024-04-05',
        guests: 0
      };

      validationMiddleware.validateBookingInput(req, res, next);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(next.called).to.be.false;
    });
  });

  describe('validateReviewInput', () => {
    it('should validate review creation input', () => {
      req.body = {
        rating: 5,
        comment: 'Great experience!',
        bookingId: 'booking123'
      };

      validationMiddleware.validateReviewInput(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should reject invalid rating', () => {
      req.body = {
        rating: 6,
        comment: 'Great experience!',
        bookingId: 'booking123'
      };

      validationMiddleware.validateReviewInput(req, res, next);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(next.called).to.be.false;
    });

    it('should reject empty comment', () => {
      req.body = {
        rating: 5,
        comment: '',
        bookingId: 'booking123'
      };

      validationMiddleware.validateReviewInput(req, res, next);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(next.called).to.be.false;
    });
  });
}); 