const { expect } = require('chai');
const sinon = require('sinon');
const validatorMiddleware = require('../../../src/middleware/validator');

describe('Validator Middleware Tests', () => {
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

  describe('validateRequiredFields', () => {
    it('should validate when all required fields are present', () => {
      req.body = {
        field1: 'value1',
        field2: 'value2'
      };

      validatorMiddleware.validateRequiredFields(['field1', 'field2'])(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should reject when required fields are missing', () => {
      req.body = {
        field1: 'value1'
      };

      validatorMiddleware.validateRequiredFields(['field1', 'field2'])(req, res, next);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(next.called).to.be.false;
    });

    it('should handle empty required fields array', () => {
      validatorMiddleware.validateRequiredFields([])(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });
  });

  describe('validateFieldTypes', () => {
    it('should validate correct field types', () => {
      req.body = {
        stringField: 'text',
        numberField: 123,
        booleanField: true,
        arrayField: [1, 2, 3],
        objectField: { key: 'value' }
      };

      const fieldTypes = {
        stringField: 'string',
        numberField: 'number',
        booleanField: 'boolean',
        arrayField: 'array',
        objectField: 'object'
      };

      validatorMiddleware.validateFieldTypes(fieldTypes)(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should reject incorrect field types', () => {
      req.body = {
        stringField: 123,
        numberField: 'text'
      };

      const fieldTypes = {
        stringField: 'string',
        numberField: 'number'
      };

      validatorMiddleware.validateFieldTypes(fieldTypes)(req, res, next);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(next.called).to.be.false;
    });
  });

  describe('validateFieldLength', () => {
    it('should validate field length within limits', () => {
      req.body = {
        shortField: '123',
        longField: '1234567890'
      };

      const lengthLimits = {
        shortField: { min: 1, max: 5 },
        longField: { min: 5, max: 20 }
      };

      validatorMiddleware.validateFieldLength(lengthLimits)(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should reject fields outside length limits', () => {
      req.body = {
        shortField: '123456',
        longField: '123'
      };

      const lengthLimits = {
        shortField: { min: 1, max: 5 },
        longField: { min: 5, max: 20 }
      };

      validatorMiddleware.validateFieldLength(lengthLimits)(req, res, next);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(next.called).to.be.false;
    });
  });

  describe('validateEnumValues', () => {
    it('should validate fields with allowed enum values', () => {
      req.body = {
        status: 'active',
        type: 'user'
      };

      const enumValues = {
        status: ['active', 'inactive', 'pending'],
        type: ['user', 'admin', 'guest']
      };

      validatorMiddleware.validateEnumValues(enumValues)(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should reject fields with invalid enum values', () => {
      req.body = {
        status: 'invalid',
        type: 'unknown'
      };

      const enumValues = {
        status: ['active', 'inactive', 'pending'],
        type: ['user', 'admin', 'guest']
      };

      validatorMiddleware.validateEnumValues(enumValues)(req, res, next);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(next.called).to.be.false;
    });
  });

  describe('validateRegexPattern', () => {
    it('should validate fields matching regex pattern', () => {
      req.body = {
        email: 'test@example.com',
        phone: '+1234567890'
      };

      const patterns = {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^\+[1-9]\d{1,14}$/
      };

      validatorMiddleware.validateRegexPattern(patterns)(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should reject fields not matching regex pattern', () => {
      req.body = {
        email: 'invalid-email',
        phone: 'invalid-phone'
      };

      const patterns = {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^\+[1-9]\d{1,14}$/
      };

      validatorMiddleware.validateRegexPattern(patterns)(req, res, next);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(next.called).to.be.false;
    });
  });
}); 