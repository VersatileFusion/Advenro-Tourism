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
        if (!params.destId || !params.checkIn || !params.checkOut) {
            throw new ErrorResponse('Please provide destination ID, check-in and check-out dates', 400);
        }

        // Validate dates
        const checkInDate = new Date(params.checkIn);
        const checkOutDate = new Date(params.checkOut);
        
        if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
            throw new ErrorResponse('Invalid date format. Please use YYYY-MM-DD format', 400);
        }

        if (checkInDate >= checkOutDate) {
            throw new ErrorResponse('Check-out date must be after check-in date', 400);
        }

        const cacheKey = this.generateCacheKey('search', params.destId, params);
        
        return this.getCachedData(
            cacheKey,
            async () => {
                try {
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
                } catch (error) {
                    if (error.response) {
                        // The request was made and the server responded with a status code
                        // that falls out of the range of 2xx
                        throw new ErrorResponse(
                            error.response.data.message || 'Error from Booking.com API',
                            error.response.status
                        );
                    } else if (error.request) {
                        // The request was made but no response was received
                        throw new ErrorResponse('No response from Booking.com API', 503);
                    } else {
                        // Something happened in setting up the request that triggered an Error
                        throw new ErrorResponse(error.message || 'Error searching hotels', 500);
                    }
                }
            },
            {
                ttl: this.cacheTTL.search,
                useRedis: true,
                compress: true
            }
        );
    }

    /**
     * Get hotel details by hotel ID
     * @param {string} hotelId Hotel ID
     * @returns {Promise<Object>} Hotel details
     */
    async getHotelDetails(hotelId) {
        try {
            const response = await this.apiClient.get('/hotels/data', {
                params: {
                    hotel_id: hotelId,
                    locale: 'en-gb'
                }
            });
            return response.data;
        } catch (error) {
            throw new ErrorResponse(
                error.response?.data?.message || 'Error fetching hotel details',
                error.response?.status || 500
            );
        }
    }

    /**
     * Search for locations (cities, regions, etc.)
     * @param {string} query Search query
     * @returns {Promise<Array>} List of locations
     */
    async searchLocations(query) {
        try {
            const response = await this.apiClient.get('/hotels/locations', {
                params: {
                    name: query,
                    locale: 'en-gb'
                }
            });
            return response.data;
        } catch (error) {
            throw new ErrorResponse(
                error.response?.data?.message || 'Error searching locations',
                error.response?.status || 500
            );
        }
    }

    /**
     * Get hotel reviews
     * @param {string} hotelId Hotel ID
     * @param {Object} params Additional parameters
     * @returns {Promise<Array>} List of reviews
     */
    async getHotelReviews(hotelId, params = {}) {
        try {
            const response = await this.apiClient.get('/hotels/reviews', {
                params: {
                    hotel_id: hotelId,
                    locale: params.locale || 'en-gb',
                    sort_type: params.sortType || 'SORT_MOST_RELEVANT',
                    page_number: params.page || '0',
                    language_filter: params.language || 'en'
                }
            });
            return response.data;
        } catch (error) {
            throw new ErrorResponse(
                error.response?.data?.message || 'Error fetching hotel reviews',
                error.response?.status || 500
            );
        }
    }

    /**
     * Get hotel description
     * @param {string} hotelId Hotel ID
     * @returns {Promise<Object>} Hotel description
     */
    async getHotelDescription(hotelId) {
        try {
            const response = await this.apiClient.get('/hotels/description', {
                params: {
                    hotel_id: hotelId,
                    locale: 'en-gb'
                }
            });
            return response.data;
        } catch (error) {
            throw new ErrorResponse(
                error.response?.data?.message || 'Error fetching hotel description',
                error.response?.status || 500
            );
        }
    }

    /**
     * Get hotel photos
     * @param {string} hotelId Hotel ID
     * @returns {Promise<Array>} List of hotel photos
     */
    async getHotelPhotos(hotelId) {
        try {
            const response = await this.apiClient.get('/hotels/photos', {
                params: {
                    hotel_id: hotelId,
                    locale: 'en-gb'
                }
            });
            return response.data;
        } catch (error) {
            throw new ErrorResponse(
                error.response?.data?.message || 'Error fetching hotel photos',
                error.response?.status || 500
            );
        }
    }

    /**
     * Get room availability for a specific hotel
     * @param {string} hotelId Hotel ID
     * @param {Object} params Search parameters
     * @returns {Promise<Object>} Room availability details
     */
    async getRoomAvailability(hotelId, params) {
        try {
            const response = await this.apiClient.get('/hotels/room-availability', {
                params: {
                    hotel_id: hotelId,
                    arrival_date: params.checkIn,
                    departure_date: params.checkOut,
                    guest_qty: params.guests || '2',
                    room_qty: params.rooms || '1',
                    currency: params.currency || 'USD',
                    locale: params.locale || 'en-gb'
                }
            });
            return response.data;
        } catch (error) {
            throw new ErrorResponse(
                error.response?.data?.message || 'Error fetching room availability',
                error.response?.status || 500
            );
        }
    }

    /**
     * Get hotel facilities
     * @param {string} hotelId Hotel ID
     * @returns {Promise<Array>} List of hotel facilities
     */
    async getHotelFacilities(hotelId) {
        try {
            const response = await this.apiClient.get('/hotels/facilities', {
                params: {
                    hotel_id: hotelId,
                    locale: 'en-gb'
                }
            });
            return response.data;
        } catch (error) {
            throw new ErrorResponse(
                error.response?.data?.message || 'Error fetching hotel facilities',
                error.response?.status || 500
            );
        }
    }

    /**
     * Get hotel amenities
     * @param {string} hotelId Hotel ID
     * @returns {Promise<Array>} List of hotel amenities
     */
    async getHotelAmenities(hotelId) {
        try {
            const response = await this.apiClient.get('/hotels/amenities', {
                params: {
                    hotel_id: hotelId,
                    locale: 'en-gb'
                }
            });
            return response.data;
        } catch (error) {
            throw new ErrorResponse(
                error.response?.data?.message || 'Error fetching hotel amenities',
                error.response?.status || 500
            );
        }
    }

    /**
     * Get nearby attractions
     * @param {string} hotelId Hotel ID
     * @param {Object} params Additional parameters
     * @returns {Promise<Array>} List of nearby attractions
     */
    async getNearbyAttractions(hotelId, params = {}) {
        try {
            const response = await this.apiClient.get('/hotels/nearby-places', {
                params: {
                    hotel_id: hotelId,
                    locale: params.locale || 'en-gb',
                    radius: params.radius || 2000, // meters
                    types: params.types || 'landmark,restaurant,shopping'
                }
            });
            return response.data;
        } catch (error) {
            throw new ErrorResponse(
                error.response?.data?.message || 'Error fetching nearby attractions',
                error.response?.status || 500
            );
        }
    }

    /**
     * Get currency exchange rates
     * @param {string} baseCurrency Base currency code
     * @returns {Promise<Object>} Exchange rates
     */
    async getExchangeRates(baseCurrency = 'USD') {
        try {
            const response = await this.apiClient.get('/meta/exchange-rates', {
                params: {
                    currency: baseCurrency,
                    locale: 'en-gb'
                }
            });
            return response.data;
        } catch (error) {
            throw new ErrorResponse(
                error.response?.data?.message || 'Error fetching exchange rates',
                error.response?.status || 500
            );
        }
    }

    /**
     * Get property types
     * @returns {Promise<Array>} List of property types
     */
    async getPropertyTypes() {
        try {
            const response = await this.apiClient.get('/meta/property-types', {
                params: {
                    locale: 'en-gb'
                }
            });
            return response.data;
        } catch (error) {
            throw new ErrorResponse(
                error.response?.data?.message || 'Error fetching property types',
                error.response?.status || 500
            );
        }
    }

    /**
     * Get hotel policies
     * @param {string} hotelId Hotel ID
     * @returns {Promise<Object>} Hotel policies
     */
    async getHotelPolicies(hotelId) {
        try {
            const response = await this.apiClient.get('/hotels/policies', {
                params: {
                    hotel_id: hotelId,
                    locale: 'en-gb'
                }
            });
            return response.data;
        } catch (error) {
            throw new ErrorResponse(
                error.response?.data?.message || 'Error fetching hotel policies',
                error.response?.status || 500
            );
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