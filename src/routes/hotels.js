const express = require('express');
const router = express.Router();
const {
    getHotels,
    getHotel,
    createHotel,
    updateHotel,
    deleteHotel,
    getHotelsInRadius
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
 *         name: rating
 *         schema:
 *           type: number
 *         description: Minimum rating
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
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
 */
router.get('/', getHotels);

/**
 * @swagger
 * /hotels/{id}:
 *   get:
 *     summary: Get single hotel
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
 *         description: Hotel found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 *       404:
 *         description: Hotel not found
 */
router.get('/:id', getHotel);

/**
 * @swagger
 * /hotels:
 *   post:
 *     summary: Create new hotel
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
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', authenticate, authorize('admin'), hotelValidation, createHotel);

/**
 * @swagger
 * /hotels/{id}:
 *   put:
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
 *       404:
 *         description: Hotel not found
 */
router.put('/:id', authenticate, authorize('admin'), hotelValidation, updateHotel);

/**
 * @swagger
 * /hotels/{id}:
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
 *       404:
 *         description: Hotel not found
 */
router.delete('/:id', authenticate, authorize('admin'), deleteHotel);

/**
 * @swagger
 * /hotels/radius/{zipcode}/{distance}:
 *   get:
 *     summary: Get hotels within radius
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
 *         description: Distance in kilometers
 *     responses:
 *       200:
 *         description: List of hotels within radius
 */
router.get('/radius/:zipcode/:distance', getHotelsInRadius);

module.exports = router; 