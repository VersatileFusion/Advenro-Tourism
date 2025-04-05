/**
 * Review Routes
 */
const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviews.controller');
const { authenticate } = require('../middleware/auth.middleware');

// GET /api/reviews - Get all reviews
router.get('/', reviewsController.getReviews);

// POST /api/reviews - Create a new review
router.post('/', authenticate, reviewsController.createReview);

// GET /api/reviews/:id - Get review details
router.get('/:id', reviewsController.getReviewDetails);

// PUT /api/reviews/:id - Update a review
router.put('/:id', authenticate, reviewsController.updateReview);

// DELETE /api/reviews/:id - Delete a review
router.delete('/:id', authenticate, reviewsController.deleteReview);

// GET /api/reviews/hotel/:id - Get hotel reviews
router.get('/hotel/:id', reviewsController.getHotelReviews);

module.exports = router; 