const express = require('express');
const router = express.Router();
const {
    getTours,
    getTour,
    createTour,
    updateTour,
    deleteTour,
    getToursWithinRadius,
    getTourStats
} = require('../controllers/tourController');

const { protect, authorize } = require('../middleware/auth');
const { tourValidation } = require('../middleware/validator');

/**
 * @swagger
 * /tours:
 *   get:
 *     summary: Get all tours
 *     tags: [Tours]
 *     parameters:
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
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, difficult]
 *         description: Tour difficulty level
 *       - in: query
 *         name: minDuration
 *         schema:
 *           type: number
 *         description: Minimum duration in days
 *       - in: query
 *         name: maxDuration
 *         schema:
 *           type: number
 *         description: Maximum duration in days
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *         description: Minimum rating
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for tour
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort by field(s) (comma-separated)
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
 *       - in: query
 *         name: populate
 *         schema:
 *           type: string
 *           enum: [reviews]
 *         description: Fields to populate
 *     responses:
 *       200:
 *         description: List of tours
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
 *                     $ref: '#/components/schemas/Tour'
 */
router.get('/', getTours);

/**
 * @swagger
 * /tours/{id}:
 *   get:
 *     summary: Get single tour
 *     tags: [Tours]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tour ID
 *     responses:
 *       200:
 *         description: Tour details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tour'
 *       404:
 *         description: Tour not found
 */
router.get('/:id', getTour);

/**
 * @swagger
 * /tours:
 *   post:
 *     summary: Create new tour
 *     tags: [Tours]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tour'
 *     responses:
 *       201:
 *         description: Tour created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('admin'), tourValidation, createTour);

/**
 * @swagger
 * /tours/{id}:
 *   put:
 *     summary: Update tour
 *     tags: [Tours]
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
 *             $ref: '#/components/schemas/Tour'
 *     responses:
 *       200:
 *         description: Tour updated successfully
 *       404:
 *         description: Tour not found
 */
router.put('/:id', protect, authorize('admin'), tourValidation, updateTour);

/**
 * @swagger
 * /tours/{id}:
 *   delete:
 *     summary: Delete tour
 *     tags: [Tours]
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
 *         description: Tour deleted successfully
 *       404:
 *         description: Tour not found
 */
router.delete('/:id', protect, authorize('admin'), deleteTour);

/**
 * @swagger
 * /tours/radius/{location}/{distance}:
 *   get:
 *     summary: Get tours within radius
 *     tags: [Tours]
 *     parameters:
 *       - in: path
 *         name: location
 *         required: true
 *         schema:
 *           type: string
 *         description: Location coordinates (lat,lng)
 *       - in: path
 *         name: distance
 *         required: true
 *         schema:
 *           type: number
 *         description: Distance radius in kilometers
 *     responses:
 *       200:
 *         description: List of tours within radius
 *       400:
 *         description: Invalid coordinates format
 */
router.get('/radius/:location/:distance', getToursWithinRadius);

/**
 * @swagger
 * /tours/stats:
 *   get:
 *     summary: Get tour statistics
 *     tags: [Tours]
 *     responses:
 *       200:
 *         description: Tour statistics by difficulty
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
 *                       _id:
 *                         type: string
 *                         description: Difficulty level
 *                       numTours:
 *                         type: number
 *                       avgRating:
 *                         type: number
 *                       avgPrice:
 *                         type: number
 *                       minPrice:
 *                         type: number
 *                       maxPrice:
 *                         type: number
 */
router.get('/stats', getTourStats);

module.exports = router; 