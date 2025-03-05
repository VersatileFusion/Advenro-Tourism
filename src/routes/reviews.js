const express = require('express');
const router = express.Router({ mergeParams: true }); // To allow nested routes
const { authenticate, authorize } = require('../middleware/auth');
const { reviewValidation } = require('../middleware/validator');
const {
    getReviews,
    getReview,
    createReview,
    updateReview,
    deleteReview
} = require('../controllers/reviewController');

// Public routes
router.get('/', getReviews);
router.get('/:id', getReview);

// Protected routes
router.post('/', authenticate, authorize('user'), reviewValidation, createReview);
router.put('/:id', authenticate, authorize('user', 'admin'), reviewValidation, updateReview);
router.delete('/:id', authenticate, authorize('user', 'admin'), deleteReview);

module.exports = router; 