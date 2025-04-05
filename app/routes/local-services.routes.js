/**
 * Local Services Routes
 */
const express = require('express');
const router = express.Router();
const localServicesController = require('../controllers/local-services.controller');

// GET /api/local-services - Get all local services
router.get('/', localServicesController.getLocalServices);

// GET /api/local-services/categories - Get service categories
router.get('/categories', localServicesController.getCategories);

// GET /api/local-services/search - Search local services
router.get('/search', localServicesController.searchLocalServices);

// GET /api/local-services/nearby - Get nearby services
router.get('/nearby', localServicesController.getNearbyServices);

// GET /api/local-services/:id - Get service details
router.get('/:id', localServicesController.getServiceDetails);

module.exports = router; 