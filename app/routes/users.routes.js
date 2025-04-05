/**
 * User Routes
 */
const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { authenticate } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// GET /api/users/profile - Get user profile
router.get('/profile', authenticate, usersController.getProfile);

// PUT /api/users/profile - Update user profile
router.put('/profile', authenticate, usersController.updateProfile);

// POST /api/users/avatar - Upload profile avatar
router.post('/avatar', authenticate, upload.single('avatar'), usersController.uploadAvatar);

// GET /api/users/preferences - Get user preferences
router.get('/preferences', authenticate, usersController.getPreferences);

// PUT /api/users/preferences - Update user preferences
router.put('/preferences', authenticate, usersController.updatePreferences);

module.exports = router; 