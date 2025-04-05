/**
 * Restaurants Routes
 */
const express = require('express');
const router = express.Router();
const restaurantsController = require('../controllers/restaurants.controller');
const auth = require('../middleware/auth.middleware');

// GET /api/restaurants - Get all restaurants
router.get('/', restaurantsController.getRestaurants);

// GET /api/restaurants/categories - Get restaurant categories
router.get('/categories', restaurantsController.getCategories);

// GET /api/restaurants/search - Search restaurants
router.get('/search', restaurantsController.searchRestaurants);

// GET /api/restaurants/popular - Get popular restaurants
router.get('/popular', restaurantsController.getPopularRestaurants);

// GET /api/restaurants/nearby - Get nearby restaurants
router.get('/nearby', restaurantsController.getNearbyRestaurants);

// GET /api/restaurants/:id - Get restaurant details
router.get('/:id', restaurantsController.getRestaurantDetails);

// GET /api/restaurants/:id/reviews - Get restaurant reviews
router.get('/:id/reviews', restaurantsController.getRestaurantReviews);

module.exports = router; 