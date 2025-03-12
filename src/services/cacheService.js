const Redis = require('ioredis');
const config = require('../config/redis');

class CacheService {
    constructor() {
        this.redis = new Redis(config);
        this.defaultTTL = 3600; // 1 hour in seconds

        this.redis.on('error', (err) => {
            console.error('Redis Error:', err);
        });

        this.redis.on('connect', () => {
            console.log('🔌 Connected to Redis');
        });
    }

    async get(key) {
        try {
            const value = await this.redis.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }

    async set(key, value, ttl = this.defaultTTL) {
        try {
            await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
            return true;
        } catch (error) {
            console.error(`Cache set error for key ${key}:`, error);
            return false;
        }
    }

    async del(key) {
        try {
            await this.redis.del(key);
            return true;
        } catch (error) {
            console.error(`Cache delete error for key ${key}:`, error);
            return false;
        }
    }

    async clearPattern(pattern) {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
            return true;
        } catch (error) {
            console.error(`Cache clear pattern error for ${pattern}:`, error);
            return false;
        }
    }

    async hashGet(hash, field) {
        try {
            const value = await this.redis.hget(hash, field);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`Cache hash get error for ${hash}:${field}:`, error);
            return null;
        }
    }

    async hashSet(hash, field, value) {
        try {
            await this.redis.hset(hash, field, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Cache hash set error for ${hash}:${field}:`, error);
            return false;
        }
    }

    async increment(key) {
        try {
            return await this.redis.incr(key);
        } catch (error) {
            console.error(`Cache increment error for key ${key}:`, error);
            return null;
        }
    }

    async setWithTags(key, value, tags = [], ttl = this.defaultTTL) {
        try {
            const multi = this.redis.multi();
            
            // Store the value
            multi.set(key, JSON.stringify(value), 'EX', ttl);
            
            // Store tag associations
            for (const tag of tags) {
                multi.sadd(`tag:${tag}`, key);
            }
            
            await multi.exec();
            return true;
        } catch (error) {
            console.error(`Cache setWithTags error for key ${key}:`, error);
            return false;
        }
    }

    async invalidateByTags(tags) {
        try {
            const multi = this.redis.multi();
            
            for (const tag of tags) {
                const tagKey = `tag:${tag}`;
                const keys = await this.redis.smembers(tagKey);
                
                if (keys.length > 0) {
                    multi.del(...keys);
                }
                multi.del(tagKey);
            }
            
            await multi.exec();
            return true;
        } catch (error) {
            console.error(`Cache invalidateByTags error:`, error);
            return false;
        }
    }
}

module.exports = new CacheService(); 