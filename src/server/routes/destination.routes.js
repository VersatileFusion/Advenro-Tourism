const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destination.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { schemas } = require('../middleware/validate');
const upload = require('../middleware/upload');

// Public routes
router.get('/', destinationController.getAllDestinations);
router.get('/search', destinationController.searchDestinations);
router.get('/recommendations', authenticate, destinationController.getRecommendations);
router.get('/:id', destinationController.getDestinationById);
router.get('/:id/attractions', destinationController.getDestinationAttractions);
router.get('/:id/hotels', destinationController.getDestinationHotels);
router.get('/:id/activities', destinationController.getDestinationActivities);
router.get('/:id/cuisine', destinationController.getDestinationCuisine);

// Protected routes (require authentication)
router.post('/:id/favorite', authenticate, destinationController.toggleFavorite);
router.post('/:id/review', authenticate, validate(schemas.createReview), destinationController.createReview);
router.put('/:id/review/:reviewId', authenticate, validate(schemas.updateReview), destinationController.updateReview);
router.delete('/:id/review/:reviewId', authenticate, destinationController.deleteReview);

// Admin routes (require authentication and admin role)
router.post('/', authenticate, authorize('admin'), validate(schemas.createDestination), upload.array('images', 10), destinationController.createDestination);
router.put('/:id', authenticate, authorize('admin'), validate(schemas.updateDestination), upload.array('images', 10), destinationController.updateDestination);
router.delete('/:id', authenticate, authorize('admin'), destinationController.deleteDestination);
router.post('/:id/attractions', authenticate, authorize('admin'), validate(schemas.createAttraction), upload.array('images', 5), destinationController.addAttraction);
router.put('/:id/attractions/:attractionId', authenticate, authorize('admin'), validate(schemas.updateAttraction), upload.array('images', 5), destinationController.updateAttraction);
router.delete('/:id/attractions/:attractionId', authenticate, authorize('admin'), destinationController.deleteAttraction);
router.post('/:id/activities', authenticate, authorize('admin'), validate(schemas.createActivity), destinationController.addActivity);
router.put('/:id/activities/:activityId', authenticate, authorize('admin'), validate(schemas.updateActivity), destinationController.updateActivity);
router.delete('/:id/activities/:activityId', authenticate, authorize('admin'), destinationController.deleteActivity);
router.post('/:id/cuisine', authenticate, authorize('admin'), validate(schemas.createCuisine), destinationController.addCuisine);
router.put('/:id/cuisine/:cuisineId', authenticate, authorize('admin'), validate(schemas.updateCuisine), destinationController.updateCuisine);
router.delete('/:id/cuisine/:cuisineId', authenticate, authorize('admin'), destinationController.deleteCuisine);

// Statistics routes (admin only)
router.get('/admin/stats', authenticate, authorize('admin'), destinationController.getDestinationStats);
router.get('/admin/popular', authenticate, authorize('admin'), destinationController.getPopularDestinations);

module.exports = router; 