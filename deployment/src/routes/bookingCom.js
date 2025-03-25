const express = require('express');
const {
    searchHotels,
    getHotelDetails,
    searchLocations,
    getHotelReviews,
    getHotelDescription,
    getHotelPhotos,
    getRoomAvailability,
    getHotelFacilities,
    getNearbyAttractions,
    getExchangeRates,
    getPropertyTypes,
    getHotelPolicies,
    getHotelChain,
    listHotelChains,
    getRoomTypes,
    getHotelAmenities,
    getHotelSustainability,
    clearCache,
    searchLimiter,
    detailsLimiter,
    cacheLimiter,
    getHotelScore,
    getHotelPaymentOptions,
    getHotelAccessibility,
    getSimilarHotels,
    getCacheStats,
    createBooking,
    getUserBookings,
    getBookingDetails,
    cancelBooking
} = require('../controllers/bookingComController');
const { protect, authorize } = require('../middleware/auth');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { schemas } = require('../middleware/validate');

const router = express.Router();

// Apply rate limiting to search endpoints
router.use(['/hotels/search', '/locations'], searchLimiter);

// Apply rate limiting to detail endpoints
router.use([
    '/hotels/:id',
    '/hotels/:id/reviews',
    '/hotels/:id/description',
    '/hotels/:id/photos',
    '/hotels/:id/rooms',
    '/hotels/:id/facilities',
    '/hotels/:id/nearby',
    '/hotels/:id/room-types',
    '/hotels/:id/amenities',
    '/hotels/:id/sustainability',
    '/hotels/:id/score',
    '/hotels/:id/payment-options',
    '/hotels/:id/accessibility',
    '/hotels/:id/similar'
], detailsLimiter);

/**
 * @swagger
 * /booking/hotels/search:
 *   get:
 *     tags: [Booking.com]
 *     summary: Search hotels using Booking.com API
 *     description: Search for hotels with various filters
 *     parameters:
 *       - name: checkIn
 *         in: query
 *         description: Check-in date (YYYY-MM-DD)
 *         required: true
 *         schema:
 *           type: string
 *       - name: checkOut
 *         in: query
 *         description: Check-out date (YYYY-MM-DD)
 *         required: true
 *         schema:
 *           type: string
 *       - name: destId
 *         in: query
 *         description: Destination ID
 *         required: true
 *         schema:
 *           type: string
 *       - name: adults
 *         in: query
 *         description: Number of adults
 *         schema:
 *           type: string
 *           default: '2'
 *       - name: rooms
 *         in: query
 *         description: Number of rooms
 *         schema:
 *           type: string
 *           default: '1'
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.get('/hotels/search', searchHotels);

/**
 * @swagger
 * /booking/hotels/{id}:
 *   get:
 *     tags: [Booking.com]
 *     summary: Get hotel details
 *     description: Get detailed information about a specific hotel
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.get('/hotels/:id', getHotelDetails);

/**
 * @swagger
 * /booking/locations:
 *   get:
 *     tags: [Booking.com]
 *     summary: Search locations
 *     description: Search for cities, regions, and landmarks
 *     parameters:
 *       - name: query
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.get('/locations', searchLocations);

/**
 * @swagger
 * /booking/hotels/{id}/reviews:
 *   get:
 *     tags: [Booking.com]
 *     summary: Get hotel reviews
 *     description: Get reviews for a specific hotel
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         schema:
 *           type: string
 *       - name: language
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.get('/hotels/:id/reviews', getHotelReviews);

/**
 * @swagger
 * /booking/hotels/{id}/description:
 *   get:
 *     tags: [Booking.com]
 *     summary: Get hotel description
 *     description: Get detailed description of a specific hotel
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.get('/hotels/:id/description', getHotelDescription);

/**
 * @swagger
 * /booking/hotels/{id}/photos:
 *   get:
 *     tags: [Booking.com]
 *     summary: Get hotel photos
 *     description: Get photos of a specific hotel
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.get('/hotels/:id/photos', getHotelPhotos);

/**
 * @swagger
 * /booking/hotels/{id}/rooms:
 *   get:
 *     tags: [Booking.com]
 *     summary: Get room availability
 *     description: Check room availability for specific dates
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: checkIn
 *         in: query
 *         required: true
 *         description: Check-in date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *       - name: checkOut
 *         in: query
 *         required: true
 *         description: Check-out date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *       - name: guests
 *         in: query
 *         schema:
 *           type: string
 *           default: '2'
 *       - name: rooms
 *         in: query
 *         schema:
 *           type: string
 *           default: '1'
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Missing required dates
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.get('/hotels/:id/rooms', getRoomAvailability);

/**
 * @swagger
 * /booking/hotels/{id}/facilities:
 *   get:
 *     tags: [Booking.com]
 *     summary: Get hotel facilities
 *     description: Get list of facilities available at the hotel
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.get('/hotels/:id/facilities', getHotelFacilities);

/**
 * @swagger
 * /booking/hotels/{id}/nearby:
 *   get:
 *     tags: [Booking.com]
 *     summary: Get nearby attractions
 *     description: Get list of attractions near the hotel
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: radius
 *         in: query
 *         schema:
 *           type: number
 *           default: 2000
 *       - name: types
 *         in: query
 *         schema:
 *           type: string
 *           default: 'landmark,restaurant,shopping'
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.get('/hotels/:id/nearby', getNearbyAttractions);

/**
 * @swagger
 * /booking/exchange-rates:
 *   get:
 *     tags: [Booking.com]
 *     summary: Get currency exchange rates
 *     description: Get current exchange rates for different currencies
 *     parameters:
 *       - name: currency
 *         in: query
 *         schema:
 *           type: string
 *           default: 'USD'
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Server error
 */
router.get('/exchange-rates', getExchangeRates);

/**
 * @swagger
 * /booking/property-types:
 *   get:
 *     tags: [Booking.com]
 *     summary: Get property types
 *     description: Get list of available property types
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Server error
 */
router.get('/property-types', getPropertyTypes);

/**
 * @swagger
 * /booking/hotels/{id}/policies:
 *   get:
 *     tags: [Booking.com]
 *     summary: Get hotel policies
 *     description: Get detailed policies of a specific hotel
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.get('/hotels/:id/policies', getHotelPolicies);

/**
 * @swagger
 * /booking/chains:
 *   get:
 *     tags: [Booking.com]
 *     summary: List hotel chains
 *     description: Get a list of hotel chains with pagination
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: string
 *           default: '0'
 *       - name: limit
 *         in: query
 *         schema:
 *           type: string
 *           default: '20'
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Server error
 */
router.get('/chains', listHotelChains);

/**
 * @swagger
 * /booking/chains/{id}:
 *   get:
 *     tags: [Booking.com]
 *     summary: Get hotel chain details
 *     description: Get detailed information about a specific hotel chain
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Chain not found
 *       500:
 *         description: Server error
 */
router.get('/chains/:id', getHotelChain);

/**
 * @swagger
 * /booking/hotels/{id}/room-types:
 *   get:
 *     tags: [Booking.com]
 *     summary: Get room types
 *     description: Get available room types for a specific hotel
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.get('/hotels/:id/room-types', getRoomTypes);

/**
 * @swagger
 * /booking/hotels/{id}/amenities:
 *   get:
 *     tags: [Booking.com]
 *     summary: Get hotel amenities
 *     description: Get detailed list of amenities for a specific hotel
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.get('/hotels/:id/amenities', getHotelAmenities);

/**
 * @swagger
 * /booking/hotels/{id}/sustainability:
 *   get:
 *     tags: [Booking.com]
 *     summary: Get hotel sustainability practices
 *     description: Get information about hotel's sustainability initiatives
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.get('/hotels/:id/sustainability', getHotelSustainability);

/**
 * @swagger
 * /booking/cache:
 *   delete:
 *     tags: [Booking.com]
 *     summary: Clear cache
 *     description: Clear the API response cache (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: pattern
 *         in: query
 *         schema:
 *           type: string
 *         description: Pattern to match cache keys (optional)
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.delete('/cache', authenticate, authorize('admin'), clearCache);

/**
 * @swagger
 * /api/v1/booking/hotels/{id}/score:
 *   get:
 *     summary: Get hotel score breakdown
 *     description: Retrieves detailed score breakdown including cleanliness, location, staff, etc.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel ID
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     overall:
 *                       type: number
 *                     cleanliness:
 *                       type: number
 *                     location:
 *                       type: number
 *                     staff:
 *                       type: number
 *                     value:
 *                       type: number
 *       429:
 *         description: Rate limit exceeded
 */
router.get('/hotels/:id/score', getHotelScore);

/**
 * @swagger
 * /api/v1/booking/hotels/{id}/payment-options:
 *   get:
 *     summary: Get hotel payment options
 *     description: Retrieves available payment methods and policies
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel ID
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     methods:
 *                       type: array
 *                       items:
 *                         type: string
 *                     policies:
 *                       type: object
 *       429:
 *         description: Rate limit exceeded
 */
router.get('/hotels/:id/payment-options', getHotelPaymentOptions);

/**
 * @swagger
 * /api/v1/booking/hotels/{id}/accessibility:
 *   get:
 *     summary: Get hotel accessibility features
 *     description: Retrieves detailed information about accessibility features
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel ID
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     features:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *       429:
 *         description: Rate limit exceeded
 */
router.get('/hotels/:id/accessibility', getHotelAccessibility);

/**
 * @swagger
 * /api/v1/booking/hotels/{id}/similar:
 *   get:
 *     summary: Get similar hotels
 *     description: Retrieves a list of similar hotels based on location, price range, and amenities
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of similar hotels to return
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       similarity_score:
 *                         type: number
 *       429:
 *         description: Rate limit exceeded
 */
router.get('/hotels/:id/similar', getSimilarHotels);

/**
 * @swagger
 * /api/v1/booking/cache/stats:
 *   get:
 *     summary: Get cache statistics
 *     description: Retrieves statistics about the cache usage and performance
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     hits:
 *                       type: integer
 *                     misses:
 *                       type: integer
 *                     keys:
 *                       type: integer
 *                     memory_usage:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 */
router.get('/cache/stats', getCacheStats);

// Protected routes
router.post('/hotels/:id/book', authenticate, validate(schemas.createBookingComBooking), createBooking);
router.get('/my-bookings', authenticate, getUserBookings);
router.get('/my-bookings/:id', authenticate, getBookingDetails);
router.put('/my-bookings/:id/cancel', authenticate, cancelBooking);

module.exports = router; 