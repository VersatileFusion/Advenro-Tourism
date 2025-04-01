const { expect } = require('chai');
const sinon = require('sinon');
const asyncMiddleware = require('../../../src/middleware/async');

describe('Async Middleware Tests', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {};
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    next = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('asyncHandler', () => {
    it('should handle successful async operations', async () => {
      const mockHandler = async (req, res) => {
        res.json({ success: true });
      };

      const wrappedHandler = asyncMiddleware.asyncHandler(mockHandler);
      await wrappedHandler(req, res, next);

      expect(res.json.calledWith({ success: true })).to.be.true;
      expect(next.called).to.be.false;
    });

    it('should handle async operations that throw errors', async () => {
      const error = new Error('Test error');
      const mockHandler = async (req, res) => {
        throw error;
      };

      const wrappedHandler = asyncMiddleware.asyncHandler(mockHandler);
      await wrappedHandler(req, res, next);

      expect(next.calledWith(error)).to.be.true;
      expect(res.json.called).to.be.false;
    });

    it('should handle async operations that reject promises', async () => {
      const error = new Error('Test error');
      const mockHandler = async (req, res) => {
        return Promise.reject(error);
      };

      const wrappedHandler = asyncMiddleware.asyncHandler(mockHandler);
      await wrappedHandler(req, res, next);

      expect(next.calledWith(error)).to.be.true;
      expect(res.json.called).to.be.false;
    });
  });

  describe('asyncErrorHandler', () => {
    it('should handle synchronous errors', async () => {
      const error = new Error('Test error');
      const mockHandler = (req, res) => {
        throw error;
      };

      const wrappedHandler = asyncMiddleware.asyncErrorHandler(mockHandler);
      await wrappedHandler(req, res, next);

      expect(next.calledWith(error)).to.be.true;
      expect(res.json.called).to.be.false;
    });

    it('should handle asynchronous errors', async () => {
      const error = new Error('Test error');
      const mockHandler = async (req, res) => {
        throw error;
      };

      const wrappedHandler = asyncMiddleware.asyncErrorHandler(mockHandler);
      await wrappedHandler(req, res, next);

      expect(next.calledWith(error)).to.be.true;
      expect(res.json.called).to.be.false;
    });

    it('should handle successful operations', async () => {
      const mockHandler = async (req, res) => {
        res.json({ success: true });
      };

      const wrappedHandler = asyncMiddleware.asyncErrorHandler(mockHandler);
      await wrappedHandler(req, res, next);

      expect(res.json.calledWith({ success: true })).to.be.true;
      expect(next.called).to.be.false;
    });
  });

  describe('asyncWithTimeout', () => {
    it('should handle operations within timeout', async () => {
      const mockHandler = async (req, res) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        res.json({ success: true });
      };

      const wrappedHandler = asyncMiddleware.asyncWithTimeout(mockHandler, 1000);
      await wrappedHandler(req, res, next);

      expect(res.json.calledWith({ success: true })).to.be.true;
      expect(next.called).to.be.false;
    });

    it('should handle operations that exceed timeout', async () => {
      const mockHandler = async (req, res) => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        res.json({ success: true });
      };

      const wrappedHandler = asyncMiddleware.asyncWithTimeout(mockHandler, 1000);
      await wrappedHandler(req, res, next);

      expect(next.called).to.be.true;
      expect(next.firstCall.args[0].message).to.include('timeout');
      expect(res.json.called).to.be.false;
    });

    it('should handle errors within timeout', async () => {
      const error = new Error('Test error');
      const mockHandler = async (req, res) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        throw error;
      };

      const wrappedHandler = asyncMiddleware.asyncWithTimeout(mockHandler, 1000);
      await wrappedHandler(req, res, next);

      expect(next.calledWith(error)).to.be.true;
      expect(res.json.called).to.be.false;
    });
  });
}); 