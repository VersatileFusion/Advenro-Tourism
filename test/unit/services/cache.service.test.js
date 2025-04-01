const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const Redis = require('ioredis');

describe('Cache Service Tests', () => {
  let cacheService;
  let mockRedis;

  beforeEach(() => {
    mockRedis = {
      get: sinon.stub(),
      set: sinon.stub(),
      del: sinon.stub(),
      flushall: sinon.stub(),
      expire: sinon.stub(),
      ttl: sinon.stub(),
      keys: sinon.stub(),
      mget: sinon.stub(),
      mset: sinon.stub(),
      mdel: sinon.stub()
    };

    // Proxyquire the cache service with mocks
    cacheService = proxyquire('../../../src/services/cache.service', {
      'ioredis': sinon.stub().returns(mockRedis)
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('get', () => {
    it('should retrieve cached value', async () => {
      const key = 'test:key';
      const value = { data: 'test data' };
      mockRedis.get.resolves(JSON.stringify(value));

      const result = await cacheService.get(key);

      expect(result).to.deep.equal(value);
      expect(mockRedis.get.calledWith(key)).to.be.true;
    });

    it('should return null for non-existent key', async () => {
      const key = 'test:key';
      mockRedis.get.resolves(null);

      const result = await cacheService.get(key);

      expect(result).to.be.null;
      expect(mockRedis.get.calledWith(key)).to.be.true;
    });

    it('should handle invalid JSON data', async () => {
      const key = 'test:key';
      mockRedis.get.resolves('invalid json');

      const result = await cacheService.get(key);

      expect(result).to.be.null;
      expect(mockRedis.get.calledWith(key)).to.be.true;
    });
  });

  describe('set', () => {
    it('should set value with TTL', async () => {
      const key = 'test:key';
      const value = { data: 'test data' };
      const ttl = 3600;
      mockRedis.set.resolves('OK');
      mockRedis.expire.resolves(1);

      await cacheService.set(key, value, ttl);

      expect(mockRedis.set.calledWith(key, JSON.stringify(value))).to.be.true;
      expect(mockRedis.expire.calledWith(key, ttl)).to.be.true;
    });

    it('should set value without TTL', async () => {
      const key = 'test:key';
      const value = { data: 'test data' };
      mockRedis.set.resolves('OK');

      await cacheService.set(key, value);

      expect(mockRedis.set.calledWith(key, JSON.stringify(value))).to.be.true;
      expect(mockRedis.expire.called).to.be.false;
    });

    it('should handle set errors', async () => {
      const key = 'test:key';
      const value = { data: 'test data' };
      const error = new Error('Redis error');
      mockRedis.set.rejects(error);

      try {
        await cacheService.set(key, value);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('del', () => {
    it('should delete cached value', async () => {
      const key = 'test:key';
      mockRedis.del.resolves(1);

      await cacheService.del(key);

      expect(mockRedis.del.calledWith(key)).to.be.true;
    });

    it('should handle non-existent key', async () => {
      const key = 'test:key';
      mockRedis.del.resolves(0);

      await cacheService.del(key);

      expect(mockRedis.del.calledWith(key)).to.be.true;
    });

    it('should handle delete errors', async () => {
      const key = 'test:key';
      const error = new Error('Redis error');
      mockRedis.del.rejects(error);

      try {
        await cacheService.del(key);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('flush', () => {
    it('should clear all cache', async () => {
      mockRedis.flushall.resolves('OK');

      await cacheService.flush();

      expect(mockRedis.flushall.calledOnce).to.be.true;
    });

    it('should handle flush errors', async () => {
      const error = new Error('Redis error');
      mockRedis.flushall.rejects(error);

      try {
        await cacheService.flush();
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('mget', () => {
    it('should retrieve multiple cached values', async () => {
      const keys = ['key1', 'key2'];
      const values = [
        JSON.stringify({ data: 'value1' }),
        JSON.stringify({ data: 'value2' })
      ];
      mockRedis.mget.resolves(values);

      const result = await cacheService.mget(keys);

      expect(result).to.deep.equal([
        { data: 'value1' },
        { data: 'value2' }
      ]);
      expect(mockRedis.mget.calledWith(keys)).to.be.true;
    });

    it('should handle missing values', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const values = [
        JSON.stringify({ data: 'value1' }),
        null,
        JSON.stringify({ data: 'value3' })
      ];
      mockRedis.mget.resolves(values);

      const result = await cacheService.mget(keys);

      expect(result).to.deep.equal([
        { data: 'value1' },
        null,
        { data: 'value3' }
      ]);
      expect(mockRedis.mget.calledWith(keys)).to.be.true;
    });
  });

  describe('mset', () => {
    it('should set multiple values with TTL', async () => {
      const entries = [
        { key: 'key1', value: { data: 'value1' } },
        { key: 'key2', value: { data: 'value2' } }
      ];
      const ttl = 3600;
      mockRedis.mset.resolves('OK');
      mockRedis.expire.resolves(1);

      await cacheService.mset(entries, ttl);

      expect(mockRedis.mset.called).to.be.true;
      expect(mockRedis.expire.callCount).to.equal(2);
    });

    it('should handle mset errors', async () => {
      const entries = [
        { key: 'key1', value: { data: 'value1' } }
      ];
      const error = new Error('Redis error');
      mockRedis.mset.rejects(error);

      try {
        await cacheService.mset(entries);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('mdel', () => {
    it('should delete multiple values', async () => {
      const keys = ['key1', 'key2'];
      mockRedis.mdel.resolves(2);

      await cacheService.mdel(keys);

      expect(mockRedis.mdel.calledWith(keys)).to.be.true;
    });

    it('should handle mdel errors', async () => {
      const keys = ['key1', 'key2'];
      const error = new Error('Redis error');
      mockRedis.mdel.rejects(error);

      try {
        await cacheService.mdel(keys);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });
}); 