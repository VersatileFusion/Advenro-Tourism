const express = require('express');
const router = express.Router();
const {
    getHotels,
    getHotel,
    createHotel,
    updateHotel,
    deleteHotel,
    getHotelsInRadius,
    getMongoDBHotels,
    searchHotels,
    getHotelReviews,
    getHotelAmenities,
    getHotelAvailability
} = require('../controllers/hotelController');

const { authenticate, authorize } = require('../middleware/auth');
const { hotelValidation } = require('../middleware/validator');
const { validate } = require('../middleware/validate');
const { schemas } = require('../middleware/validate');

/**
 * @swagger
 * components:
 *   schemas:
 *     Hotel:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - price
 *         - location
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         location:
 *           type: object
 *         amenities:
 *           type: array
 *         images:
 *           type: array
 *         rating:
 *           type: number
 *         reviews:
 *           type: array
 */

/**
 * @swagger
 * /api/v1/hotels:
 *   get:
 *     summary: Get all hotels
 *     tags: [Hotels]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of hotels per page
 *     responses:
 *       200:
 *         description: List of hotels
 */
router.get('/', getHotels);

/**
 * @swagger
 * /api/v1/hotels/mongodb:
 *   get:
 *     summary: Get all MongoDB hotels (public)
 *     tags: [Hotels]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of hotels to return (default 100)
 *     responses:
 *       200:
 *         description: List of all MongoDB hotels
 */
router.get('/mongodb', getMongoDBHotels);

/**
 * @swagger
 * /api/v1/hotels/search:
 *   get:
 *     summary: Search hotels
 *     tags: [Hotels]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', searchHotels);

/**
 * @swagger
 * /api/v1/hotels/radius:
 *   get:
 *     summary: Get hotels within radius
 *     tags: [Hotels]
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         description: Longitude
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *         description: Radius in kilometers
 *     responses:
 *       200:
 *         description: Hotels within radius
 */
router.get('/radius', getHotelsInRadius);

/**
 * @swagger
 * /api/v1/hotels/{id}:
 *   get:
 *     summary: Get hotel by ID
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hotel details
 */
router.get('/:id', getHotel);

/**
 * @swagger
 * /api/v1/hotels/{id}/reviews:
 *   get:
 *     summary: Get hotel reviews
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hotel reviews
 */
router.get('/:id/reviews', getHotelReviews);

/**
 * @swagger
 * /api/v1/hotels/{id}/amenities:
 *   get:
 *     summary: Get hotel amenities
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hotel amenities
 */
router.get('/:id/amenities', getHotelAmenities);

/**
 * @swagger
 * /api/v1/hotels/{id}/availability:
 *   get:
 *     summary: Get hotel availability
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Hotel availability
 */
router.get('/:id/availability', getHotelAvailability);

// Protected routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/hotels:
 *   post:
 *     summary: Create a new hotel
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Hotel'
 *     responses:
 *       201:
 *         description: Hotel created successfully
 */
router.post('/', authorize('admin'), hotelValidation, createHotel);

/**
 * @swagger
 * /api/v1/hotels/{id}:
 *   patch:
 *     summary: Update hotel
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Hotel'
 *     responses:
 *       200:
 *         description: Hotel updated successfully
 */
router.patch('/:id', authorize('admin'), hotelValidation, updateHotel);

/**
 * @swagger
 * /api/v1/hotels/{id}:
 *   delete:
 *     summary: Delete hotel
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hotel deleted successfully
 */
router.delete('/:id', authorize('admin'), deleteHotel);

module.exports = router; 