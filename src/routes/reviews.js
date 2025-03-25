const express = require('express');
const reviewsController = require('../controllers/reviews');
const auth = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// Public routes
router.get('/', reviewsController.getAllReviews);
router.get('/:id', reviewsController.getReview);

// Protected routes
router.use(auth);
router.post('/', reviewsController.createReview);
router.patch('/:id', reviewsController.updateReview);
router.delete('/:id', reviewsController.deleteReview);
router.post('/:id/like', reviewsController.likeReview);
router.post('/:id/helpful', reviewsController.markHelpful);

module.exports = router; 