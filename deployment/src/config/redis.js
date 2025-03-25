require('dotenv').config();
const Redis = require('ioredis');
const sinon = require('sinon');

// Use mock Redis client for tests
if (process.env.NODE_ENV === 'test') {
    const mockRedis = {
        get: sinon.stub(),
        set: sinon.stub(),
        setex: sinon.stub(),
        del: sinon.stub(),
        flushall: sinon.stub(),
        quit: sinon.stub(),
        on: sinon.stub(),
        connect: sinon.stub(),
        disconnect: sinon.stub()
    };
    module.exports = mockRedis;
} else {
    const redisClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        maxRetriesPerRequest: 3
    });

    redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
        console.log('Connected to Redis');
    });

    module.exports = redisClient;
} 