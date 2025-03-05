const express = require('express');
const router = express.Router();
const {
    getFlights,
    getFlight,
    createFlight,
    updateFlight,
    deleteFlight,
    searchFlights
} = require('../controllers/flightController');

const { authenticate, authorize } = require('../middleware/auth');
const { flightValidation } = require('../middleware/validator');

/**
 * @swagger
 * /flights/search:
 *   get:
 *     summary: Search flights
 *     tags: [Flights]
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *         description: Departure city
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *         description: Arrival city
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Departure date (YYYY-MM-DD)
 *       - in: query
 *         name: passengers
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Number of passengers
 *       - in: query
 *         name: class
 *         schema:
 *           type: string
 *           enum: [economy, business, first]
 *           default: economy
 *         description: Flight class
 *     responses:
 *       200:
 *         description: List of matching flights
 *       400:
 *         description: Missing required search parameters
 */
router.get('/search', searchFlights);

/**
 * @swagger
 * /flights:
 *   get:
 *     summary: Get all flights
 *     tags: [Flights]
 *     parameters:
 *       - in: query
 *         name: departureCity
 *         schema:
 *           type: string
 *         description: Filter by departure city
 *       - in: query
 *         name: arrivalCity
 *         schema:
 *           type: string
 *         description: Filter by arrival city
 *       - in: query
 *         name: departureDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by departure date
 *       - in: query
 *         name: airline
 *         schema:
 *           type: string
 *         description: Filter by airline
 *       - in: query
 *         name: class
 *         schema:
 *           type: string
 *           enum: [economy, business, first]
 *         description: Filter by class
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price
 *       - in: query
 *         name: seats
 *         schema:
 *           type: integer
 *         description: Minimum available seats
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Results per page
 *     responses:
 *       200:
 *         description: List of flights
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
 *                     $ref: '#/components/schemas/Flight'
 */
router.get('/', getFlights);

/**
 * @swagger
 * /flights/{id}:
 *   get:
 *     summary: Get single flight
 *     tags: [Flights]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Flight ID
 *     responses:
 *       200:
 *         description: Flight details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Flight'
 *       404:
 *         description: Flight not found
 */
router.get('/:id', getFlight);

/**
 * @swagger
 * /flights:
 *   post:
 *     summary: Create new flight
 *     tags: [Flights]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Flight'
 *     responses:
 *       201:
 *         description: Flight created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', authenticate, authorize('admin'), flightValidation, createFlight);

/**
 * @swagger
 * /flights/{id}:
 *   put:
 *     summary: Update flight
 *     tags: [Flights]
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
 *             $ref: '#/components/schemas/Flight'
 *     responses:
 *       200:
 *         description: Flight updated successfully
 *       404:
 *         description: Flight not found
 */
router.put('/:id', authenticate, authorize('admin'), flightValidation, updateFlight);

/**
 * @swagger
 * /flights/{id}:
 *   delete:
 *     summary: Delete flight
 *     tags: [Flights]
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
 *         description: Flight deleted successfully
 *       404:
 *         description: Flight not found
 */
router.delete('/:id', authenticate, authorize('admin'), deleteFlight);

module.exports = router; 