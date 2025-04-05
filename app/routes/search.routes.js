/**
 * Search Routes
 * Routes for search functionality
 */
const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');

/**
 * @route GET /api/search/unified
 * @desc Perform a unified search across multiple entities
 * @access Public
 */
router.get('/unified', (req, res) => {
  try {
    const result = searchController.unifiedSearch(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route GET /api/search/suggestions
 * @desc Get search suggestions based on input
 * @access Public
 */
router.get('/suggestions', (req, res) => {
  try {
    const result = searchController.getSearchSuggestions(req.query.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route GET /api/search/trending
 * @desc Get trending searches and destinations
 * @access Public
 */
router.get('/trending', (req, res) => {
  try {
    const result = searchController.getTrending();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 