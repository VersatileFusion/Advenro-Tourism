const express = require('express');
const router = express.Router();
const { getMongoDBHotels } = require('../controllers/hotelController');

/**
 * @swagger
 * /api/v1/mongodb-hotels:
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
router.get('/', getMongoDBHotels);

module.exports = router; 