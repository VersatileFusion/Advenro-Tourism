const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotel.controller');
const { authenticate, authorize } = require('../middleware/auth');
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
 *           description: Auto-generated MongoDB ID
 *         name:
 *           type: string
 *           description: Hotel name
 *         description:
 *           type: string
 *           description: Detailed hotel description
 *         price:
 *           type: number
 *           description: Price per night
 *         location:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [Point]
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         rating:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *         createdAt:
 *           type: string
 *           format: date-time
 *       example:
 *         name: "Luxury Resort & Spa"
 *         description: "5-star luxury resort with ocean view"
 *         price: 299.99
 *         location:
 *           type: "Point"
 *           coordinates: [12.34, 56.78]
 *         amenities: ["wifi", "pool", "spa"]
 *         images: ["hotel1.jpg", "hotel2.jpg"]
 *         rating: 4.5
 */

/**
 * @swagger
 * /hotels:
 *   get:
 *     summary: Get all hotels
 *     description: Retrieve a list of hotels with optional filtering and pagination
 *     tags: [Hotels]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: "-createdAt"
 *         description: Sort order (prefix with - for descending)
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Location coordinates (lat,lng) for proximity search
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
 *                   properties:
 *                     current:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Hotel'
 */
router.get('/', hotelController.getAllHotels);

/**
 * @swagger
 * /hotels/{id}:
 *   get:
 *     summary: Get hotel by ID
 *     description: Retrieve detailed information about a specific hotel
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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Hotel'
 *       404:
 *         description: Hotel not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', hotelController.getHotelById);

/**
 * @swagger
 * /hotels:
 *   post:
 *     summary: Create new hotel
 *     description: Create a new hotel (Admin only)
 *     tags: [Hotels]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               location:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [Point]
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Hotel created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Hotel'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to create hotels
 */
router.post('/', authenticate, authorize('admin'), validate(schemas.createHotel), hotelController.createHotel);

/**
 * @swagger
 * /hotels/{id}:
 *   put:
 *     summary: Update hotel
 *     description: Update hotel details (Admin only)
 *     tags: [Hotels]
 *     security:
 *       - BearerAuth: []
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               location:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [Point]
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Hotel updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Hotel'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to update hotels
 *       404:
 *         description: Hotel not found
 */
router.put('/:id', authenticate, authorize('admin'), validate(schemas.updateHotel), hotelController.updateHotel);

/**
 * @swagger
 * /hotels/{id}:
 *   delete:
 *     summary: Delete hotel
 *     description: Delete a hotel (Admin only)
 *     tags: [Hotels]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel ID
 *     responses:
 *       200:
 *         description: Hotel deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to delete hotels
 *       404:
 *         description: Hotel not found
 */
router.delete('/:id', authenticate, authorize('admin'), hotelController.deleteHotel);

module.exports = router; 