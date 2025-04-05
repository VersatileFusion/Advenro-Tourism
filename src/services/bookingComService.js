const axios = require('axios');
const ErrorResponse = require('../utils/errorResponse');
const NodeCache = require('node-cache');
const Redis = require('ioredis');
const { promisify } = require('util');
const zlib = require('zlib');
const gzip = promisify(zlib.gzip);
const ungzip = promisify(zlib.gunzip);
const { Hotel, Booking } = require('../models');
const AppError = require('../utils/appError');

class BookingComService {
    constructor() {
        // Direct RapidAPI connection
        this.apiClient = axios.create({
            baseURL: 'https://booking-com.p.rapidapi.com/v1',
            headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
            },
            timeout: 10000 // 10 seconds timeout
        });

        // Initialize in-memory cache with different TTLs for different types of data
        this.memoryCache = new NodeCache({ 
            stdTTL: 1800, // 30 minutes default
            checkperiod: 120,
            useClones: false,
            deleteOnExpire: true
        });

        // Initialize Redis cache if configured
        if (process.env.REDIS_URL) {
            this.redisCache = new Redis(process.env.REDIS_URL, {
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                maxRetriesPerRequest: 3
            });

            // Set up Redis error handling
            this.redisCache.on('error', (err) => {
                console.error('Redis Cache Error:', err);
            });
        }

        // Cache TTL configurations (in seconds)
        this.cacheTTL = {
            search: 300,          // 5 minutes for search results
            details: 1800,        // 30 minutes for hotel details
            static: 86400,        // 24 hours for static data
            reviews: 3600,        // 1 hour for reviews
            availability: 60      // 1 minute for availability
        };

        // Initialize cache statistics
        this.cacheStats = {
            hits: 0,
            misses: 0,
            keys: 0,
            memory_usage: 0
        };
    }

    /**
     * Get cached data using multiple cache layers with compression
     * @param {string} key Cache key
     * @param {Function} fetchFn Function to fetch data if not cached
     * @param {Object} options Cache options
     * @returns {Promise<any>} Cached or fresh data
     */
    async getCachedData(key, fetchFn, options = {}) {
        const {
            ttl = this.cacheTTL.details,
            useRedis = true,
            forceRefresh = false,
            compress = true
        } = options;

        if (forceRefresh) {
            const fresh = await fetchFn();
            await this.setCacheData(key, fresh, { ttl, useRedis, compress });
            return fresh;
        }

        // Try memory cache first
        const memCached = this.memoryCache.get(key);
        if (memCached) {
            this.cacheStats.hits++;
            return memCached;
        }

        // Try Redis cache if available
        if (this.redisCache && useRedis) {
            try {
                const redisCached = await this.redisCache.get(key);
                if (redisCached) {
                    let parsed;
                    if (compress) {
                        const uncompressed = await ungzip(Buffer.from(redisCached, 'base64'));
                        parsed = JSON.parse(uncompressed.toString());
                    } else {
                        parsed = JSON.parse(redisCached);
                    }
                    this.memoryCache.set(key, parsed, ttl);
                    this.cacheStats.hits++;
                    return parsed;
                }
            } catch (error) {
                console.error('Redis cache error:', error);
                // Continue with API call if Redis fails
            }
        }

        // Fetch fresh data
        this.cacheStats.misses++;
        const fresh = await fetchFn();
        await this.setCacheData(key, fresh, { ttl, useRedis, compress });
        return fresh;
    }

    /**
     * Set data in all cache layers with compression
     * @param {string} key Cache key
     * @param {any} data Data to cache
     * @param {Object} options Cache options
     */
    async setCacheData(key, data, options = {}) {
        const { ttl = this.cacheTTL.details, useRedis = true, compress = true } = options;

        this.memoryCache.set(key, data, ttl);
        
        if (this.redisCache && useRedis) {
            try {
                let cacheData;
                if (compress) {
                    const compressed = await gzip(JSON.stringify(data));
                    cacheData = compressed.toString('base64');
                } else {
                    cacheData = JSON.stringify(data);
                }
                await this.redisCache.setex(key, ttl, cacheData);
            } catch (error) {
                console.error('Redis cache set error:', error);
            }
        }

        this.updateCacheStats();
    }

    /**
     * Clear cache by pattern
     * @param {string} pattern Pattern to match cache keys
     * @returns {Promise<void>}
     */
    async clearCache(pattern) {
        if (pattern) {
            this.memoryCache.keys().forEach(key => {
                if (key.includes(pattern)) {
                    this.memoryCache.del(key);
                }
            });

            if (this.redisCache) {
                const keys = await this.redisCache.keys(`*${pattern}*`);
                if (keys.length > 0) {
                    await this.redisCache.del(keys);
                }
            }
        } else {
            this.memoryCache.flushAll();
            if (this.redisCache) {
                await this.redisCache.flushall();
            }
        }

        this.updateCacheStats();
    }

    /**
     * Update cache statistics
     * @private
     */
    updateCacheStats() {
        const keys = this.memoryCache.keys();
        const stats = this.memoryCache.getStats();
        
        this.cacheStats.keys = keys.length;
        this.cacheStats.memory_usage = stats.vsize;
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        this.updateCacheStats();
        return this.cacheStats;
    }

    /**
     * Generate cache key with prefix
     * @param {string} type Cache type
     * @param {string} id Identifier
     * @param {Object} params Additional parameters
     * @returns {string} Cache key
     * @private
     */
    generateCacheKey(type, id, params = {}) {
        const baseKey = `booking:${type}:${id}`;
        if (Object.keys(params).length === 0) {
            return baseKey;
        }
        
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((acc, key) => {
                acc[key] = params[key];
                return acc;
            }, {});
            
        return `${baseKey}:${JSON.stringify(sortedParams)}`;
    }

    /**
     * Search for hotels in a specific location
     * @param {Object} params Search parameters
     * @returns {Promise<Array>} List of hotels
     */
    async searchHotels(params) {
        try {
            // Generate cache key for this search
            const cacheKey = this.generateCacheKey('search', params.destId || 'default', params);
            
            return this.getCachedData(
                cacheKey,
                async () => {
                    // Try the real API without fallback
                    const response = await this.apiClient.get('/hotels/search', {
                        params: {
                            checkin_date: params.checkIn,
                            checkout_date: params.checkOut,
                            units: 'metric',
                            room_number: params.rooms || '1',
                            adults_number: params.adults || '2',
                            dest_id: params.destId,
                            dest_type: params.destType || 'city',
                            locale: params.locale || 'en-gb',
                            order_by: params.orderBy || 'popularity',
                            filter_by_currency: params.currency || 'USD',
                            page_number: params.page || '0',
                            categories_filter_ids: params.categories || ''
                        }
                    });
                    
                    if (!response.data || !response.data.result) {
                        throw new ErrorResponse('Invalid response from Booking.com API', 500);
                    }
                    
                    return response.data.result;
                },
                { ttl: this.cacheTTL.search }
            );
        } catch (error) {
            console.error('Error in searchHotels:', error);
            throw new ErrorResponse('Failed to retrieve hotel data from API', 500);
        }
    }

    /**
     * Search for locations
     * @param {string} query Search query
     * @returns {Promise<Array>} List of locations
     */
    async searchLocations(query) {
        try {
            const cacheKey = this.generateCacheKey('locations', query);
            
            return this.getCachedData(
                cacheKey,
                async () => {
                    // Use real API without fallback
                    const response = await this.apiClient.get('/hotels/locations', {
                        params: {
                            name: query,
                            locale: 'en-gb'
                        }
                    });
                    
                    if (!response.data) {
                        throw new ErrorResponse('Invalid response from locations API', 500);
                    }
                    
                    return response.data;
                },
                { ttl: this.cacheTTL.static }
            );
        } catch (error) {
            console.error('Error in searchLocations:', error);
            throw new ErrorResponse('Failed to retrieve location data from API', 500);
        }
    }

    /**
     * Get hotel details
     * @param {string} hotelId Hotel ID
     * @returns {Promise<Object>} Hotel details
     */
    async getHotelDetails(hotelId) {
        try {
            const cacheKey = this.generateCacheKey('hotel', hotelId);
            
            return this.getCachedData(
                cacheKey,
                async () => {
                    // Use real API without fallback
                    const response = await this.apiClient.get('/hotels/data', {
                        params: {
                            hotel_id: hotelId,
                            locale: 'en-gb'
                        }
                    });
                    
                    return response.data;
                },
                { ttl: this.cacheTTL.details }
            );
        } catch (error) {
            console.error('Error in getHotelDetails:', error);
            throw new ErrorResponse('Failed to retrieve hotel details from API', 500);
        }
    }

    /**
     * Get hotel reviews
     * @param {string} hotelId Hotel ID
     * @param {Object} options Options
     * @returns {Promise<Array>} Hotel reviews
     */
    async getHotelReviews(hotelId, options = {}) {
        try {
            const cacheKey = this.generateCacheKey('reviews', hotelId, options);
            
            return this.getCachedData(
                cacheKey,
                async () => {
                    // Use real API without fallback
                    const response = await this.apiClient.get('/hotels/reviews', {
                        params: {
                            hotel_id: hotelId,
                            locale: options.language || 'en-gb',
                            sort_type: options.sort || 'SORT_MOST_RELEVANT',
                            customer_type: options.customerType || '',
                            page_number: options.page || 1
                        }
                    });
                    
                    return response.data;
                },
                { ttl: this.cacheTTL.reviews }
            );
        } catch (error) {
            console.error('Error in getHotelReviews:', error);
            throw new ErrorResponse('Failed to retrieve hotel reviews from API', 500);
        }
    }

    /**
     * Get nearby attractions for a hotel
     * @param {string} hotelId Hotel ID
     * @param {Object} params Additional parameters
     * @returns {Promise<Array>} List of nearby attractions
     */
    async getNearbyAttractions(hotelId, params = {}) {
        try {
            const cacheKey = this.generateCacheKey('nearby', hotelId, params);
            
            return this.getCachedData(
                cacheKey,
                async () => {
                    const response = await this.apiClient.get('/hotels/nearby-places', {
                        params: {
                            hotel_id: hotelId,
                            locale: params.locale || 'en-gb',
                            radius: params.radius || 3, // kilometers
                            types: params.types || 'landmark,restaurant,shopping,museum,entertainment'
                        }
                    });
                    
                    if (!response.data) {
                        throw new ErrorResponse('Invalid response from nearby attractions API', 500);
                    }
                    
                    // Process and categorize the attractions
                    const attractions = Array.isArray(response.data) ? response.data : [];
                    
                    // Add additional metadata and formatting
                    return attractions.map(attraction => ({
                        ...attraction,
                        distance_formatted: this.formatDistance(attraction.distance || 0)
                    }));
                },
                { ttl: this.cacheTTL.static }
            );
        } catch (error) {
            console.error('Error in getNearbyAttractions:', error);
            throw new ErrorResponse('Failed to retrieve nearby attractions', 500);
        }
    }
    
    /**
     * Format distance for display
     * @param {number} distance Distance in kilometers
     * @returns {string} Formatted distance
     * @private
     */
    formatDistance(distance) {
        if (distance < 1) {
            // Convert to meters for distances less than 1km
            const meters = Math.round(distance * 1000);
            return `${meters} m`;
        } else {
            // Round to 1 decimal place for kilometers
            return `${distance.toFixed(1)} km`;
        }
    }
}

exports.createBooking = async (hotelId, bookingData, userId) => {
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
        throw new AppError('Hotel not found', 404);
    }

    // Check if room is available for the dates
    const { roomType, checkIn, checkOut, guests } = bookingData;
    const room = hotel.rooms.find(r => r.type === roomType);
    if (!room) {
        throw new AppError('Room type not found', 404);
    }

    // Calculate total price
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = room.price * nights;

    // Create booking
    const booking = await Booking.create({
        user: userId,
        item: hotelId,
        bookingType: 'Hotel',
        startDate: checkIn,
        endDate: checkOut,
        price: totalPrice,
        guests,
        roomType,
        status: 'confirmed',
        paymentStatus: 'pending'
    });

    return booking;
};

// Export a singleton instance
module.exports = new BookingComService(); 