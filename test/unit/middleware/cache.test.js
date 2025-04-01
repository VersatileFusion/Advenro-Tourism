const { expect } = require('chai');
const sinon = require('sinon');
const cacheMiddleware = require('../../../src/middleware/cache');

describe('Cache Middleware Tests', () => {
  let req;
  let res;
  let next;
  let mockCache;

  beforeEach(() => {
    req = {
      method: 'GET',
      originalUrl: '/api/hotels',
      headers: {}
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
      send: sinon.stub()
    };
    next = sinon.stub();
    mockCache = {
      get: sinon.stub(),
      set: sinon.stub(),
      del: sinon.stub(),
      flush: sinon.stub()
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('cacheMiddleware', () => {
    it('should cache GET requests', async () => {
      const mockData = { hotels: [{ id: 1, name: 'Hotel 1' }] };
      mockCache.get.resolves(null);
      mockCache.set.resolves(true);

      await cacheMiddleware.cacheMiddleware(mockCache)(req, res, next);

      expect(mockCache.get.calledOnce).to.be.true;
      expect(mockCache.set.calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
    });

    it('should return cached data for GET requests', async () => {
      const mockData = { hotels: [{ id: 1, name: 'Hotel 1' }] };
      mockCache.get.resolves(mockData);

      await cacheMiddleware.cacheMiddleware(mockCache)(req, res, next);

      expect(mockCache.get.calledOnce).to.be.true;
      expect(res.json.calledWith(mockData)).to.be.true;
      expect(next.called).to.be.false;
    });

    it('should not cache non-GET requests', async () => {
      req.method = 'POST';

      await cacheMiddleware.cacheMiddleware(mockCache)(req, res, next);

      expect(mockCache.get.called).to.be.false;
      expect(mockCache.set.called).to.be.false;
      expect(next.calledOnce).to.be.true;
    });
  });

  describe('invalidateCache', () => {
    it('should invalidate cache for specific key', async () => {
      const key = 'hotel:123';
      mockCache.del.resolves(true);

      await cacheMiddleware.invalidateCache(mockCache, key);

      expect(mockCache.del.calledWith(key)).to.be.true;
    });

    it('should handle cache invalidation errors', async () => {
      const key = 'hotel:123';
      const error = new Error('Cache deletion failed');
      mockCache.del.rejects(error);

      try {
        await cacheMiddleware.invalidateCache(mockCache, key);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('clearAllCache', () => {
    it('should clear all cache', async () => {
      mockCache.flush.resolves(true);

      await cacheMiddleware.clearAllCache(mockCache);

      expect(mockCache.flush.calledOnce).to.be.true;
    });

    it('should handle cache clearing errors', async () => {
      const error = new Error('Cache clearing failed');
      mockCache.flush.rejects(error);

      try {
        await cacheMiddleware.clearAllCache(mockCache);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('cacheWithTTL', () => {
    it('should cache data with specified TTL', async () => {
      const key = 'hotel:123';
      const data = { id: 123, name: 'Hotel 123' };
      const ttl = 3600; // 1 hour
      mockCache.set.resolves(true);

      await cacheMiddleware.cacheWithTTL(mockCache, key, data, ttl);

      expect(mockCache.set.calledWith(key, data, ttl)).to.be.true;
    });

    it('should handle cache setting errors', async () => {
      const key = 'hotel:123';
      const data = { id: 123, name: 'Hotel 123' };
      const ttl = 3600;
      const error = new Error('Cache setting failed');
      mockCache.set.rejects(error);

      try {
        await cacheMiddleware.cacheWithTTL(mockCache, key, data, ttl);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });
}); 