const express = require('express');
const router = express.Router();
const {
    searchDestinations,
    getDestination,
    getPopularDestinations
} = require('../controllers/destinationController');

// @route   GET api/destinations/search
// @desc    Search destinations by query
// @access  Public
router.get('/search', searchDestinations);

// @route   GET api/destinations/popular
// @desc    Get popular destinations
// @access  Public
router.get('/popular', getPopularDestinations);

// @route   GET api/destinations/:id
// @desc    Get destination by ID
// @access  Public
router.get('/:id', getDestination);

module.exports = router; 