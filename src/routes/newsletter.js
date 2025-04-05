const express = require('express');
const router = express.Router();
const { 
  subscribe, 
  unsubscribe, 
  getSubscribers 
} = require('../controllers/newsletterController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /newsletter/subscribe:
 *   post:
 *     summary: Subscribe to the newsletter
 *     tags: [Newsletter]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Successfully subscribed to the newsletter
 *       400:
 *         description: Email is required or invalid format
 */
router.post('/subscribe', subscribe);

/**
 * @swagger
 * /newsletter/unsubscribe:
 *   post:
 *     summary: Unsubscribe from the newsletter
 *     tags: [Newsletter]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Successfully unsubscribed from the newsletter
 *       400:
 *         description: Email is required or invalid format
 *       404:
 *         description: Email not found in subscribers list
 */
router.post('/unsubscribe', unsubscribe);

/**
 * @swagger
 * /newsletter/subscribers:
 *   get:
 *     summary: Get all newsletter subscribers (admin only)
 *     tags: [Newsletter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, unsubscribed]
 *         description: Filter by subscription status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: subscribedAt
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
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
 *           default: 20
 *         description: Results per page
 *     responses:
 *       200:
 *         description: List of newsletter subscribers with pagination
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not admin
 */
router.get('/subscribers', authenticate, authorize('admin'), getSubscribers);

module.exports = router; 