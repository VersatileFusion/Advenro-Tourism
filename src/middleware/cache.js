const redisClient = require('../config/redis');

/**
 * Cache middleware for API responses
 * @param {number} duration - Cache duration in seconds
 */
exports.cacheResponse = (duration) => {
    return async (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }

        const key = `cache:${req.originalUrl}`;

        try {
            const cachedResponse = await redisClient.get(key);
            
            if (cachedResponse) {
                return res.json(JSON.parse(cachedResponse));
            }

            // Store the original res.json function
            const originalJson = res.json.bind(res);
            
            // Override res.json method to cache the response
            res.json = (body) => {
                // Cache the response
                redisClient.setex(key, duration, JSON.stringify(body));
                // Send the original response
                return originalJson(body);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};

/**
 * Clear cache by pattern
 * @param {string} pattern - Pattern to match cache keys
 */
exports.clearCache = async (pattern) => {
    try {
        const keys = await redisClient.keys(`cache:${pattern}`);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    } catch (error) {
        console.error('Clear cache error:', error);
    }
};

/**
 * Cache database queries
 * @param {string} key - Cache key
 * @param {number} duration - Cache duration in seconds
 * @param {Function} queryFn - Function that returns the query promise
 */
exports.cacheQuery = async (key, duration, queryFn) => {
    try {
        const cachedResult = await redisClient.get(`query:${key}`);
        
        if (cachedResult) {
            return JSON.parse(cachedResult);
        }

        const result = await queryFn();
        await redisClient.setex(`query:${key}`, duration, JSON.stringify(result));
        
        return result;
    } catch (error) {
        console.error('Cache query error:', error);
        return queryFn(); // Fallback to original query if caching fails
    }
}; 