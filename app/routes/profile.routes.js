/**
 * Profile Routes
 * Routes for user profile management
 */

const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/profile.controller');
const { authenticateJWT } = require('../middleware/auth');

// Get user profile
router.get('/profile', authenticateJWT, ProfileController.getProfile);

// Update user profile
router.put('/profile', authenticateJWT, ProfileController.updateProfile);

// Upload profile picture
router.post('/profile/avatar', authenticateJWT, ProfileController.uploadProfilePicture);

// Change password
router.post('/profile/change-password', authenticateJWT, ProfileController.changePassword);

// Get saved items
router.get('/profile/saved-items', authenticateJWT, ProfileController.getSavedItems);

// Save an item
router.post('/profile/saved-items', authenticateJWT, ProfileController.saveItem);

// Remove a saved item
router.delete('/profile/saved-items/:itemId', authenticateJWT, ProfileController.removeItem);

// Delete account
router.delete('/profile', authenticateJWT, ProfileController.deleteAccount);

module.exports = router; 