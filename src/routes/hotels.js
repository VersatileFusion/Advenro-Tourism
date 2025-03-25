const express = require('express');
const router = express.Router();
const {
    getHotels,
    getHotel,
    createHotel,
    updateHotel,
    deleteHotel,
    getHotelsInRadius,
    getMongoDBHotels
} = require('../controllers/hotelController');

const { authenticate, authorize } = require('../middleware/auth');
const { hotelValidation } = require('../middleware/validator');

/**
 * @swagger
 * /hotels:
 *   get:
 *     summary: Get all hotels
 *     tags: [Hotels]
 *     parameters:
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price per night
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price per night
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: City name
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of hotels to return (default 100)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (for pagination)
 *       - in: query
 *         name: amenities
 *         schema:
 *           type: string
 *         description: Comma-separated list of amenities to filter by
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Field to sort by (prefix with - for descending)
 *     responses:
 *       200:
 *         description: List of hotels
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 pagination:
 *                   type: object
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Hotel'
 *       500:
 *         description: Server error
 */
router.get('/', getHotels);

/**
 * @swagger
 * /hotels/radius/{zipcode}/{distance}:
 *   get:
 *     summary: Get hotels within a radius
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: zipcode
 *         required: true
 *         schema:
 *           type: string
 *         description: Zipcode to search from
 *       - in: path
 *         name: distance
 *         required: true
 *         schema:
 *           type: number
 *         description: Distance in miles
 *     responses:
 *       200:
 *         description: List of hotels
 *       500:
 *         description: Server error
 */
router.get('/radius/:zipcode/:distance', getHotelsInRadius);

/**
 * @swagger
 * /hotels/mongodb:
 *   get:
 *     summary: Get hotels from MongoDB Atlas Sample Dataset
 *     tags: [Hotels]
 *     responses:
 *       200:
 *         description: List of hotels from MongoDB sample data
 *       500:
 *         description: Server error
 */
router.get('/mongodb', getMongoDBHotels);

/**
 * @swagger
 * /hotels/{id}:
 *   get:
 *     summary: Get a single hotel
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel ID
 *     responses:
 *       200:
 *         description: Hotel details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getHotel);

/**
 * @swagger
 * /hotels:
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
 *         description: Created hotel
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, authorize('admin'), hotelValidation, createHotel);

/**
 * @swagger
 * /hotels/{id}:
 *   put:
 *     summary: Update a hotel
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Hotel'
 *     responses:
 *       200:
 *         description: Updated hotel
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticate, authorize('admin'), hotelValidation, updateHotel);

/**
 * @swagger
 * /hotels/{id}:
 *   delete:
 *     summary: Delete a hotel
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel ID
 *     responses:
 *       200:
 *         description: Hotel deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticate, authorize('admin'), deleteHotel);

module.exports = router; 