/**
 * Authentication Routes
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

// POST /api/auth/register - Register a new user
router.post('/register', authController.register);

// POST /api/auth/login - Login an existing user
router.post('/login', authController.login);

// POST /api/auth/logout - Logout current user
router.post('/logout', authenticate, authController.logout);

// POST /api/auth/refresh-token - Refresh access token
router.post('/refresh-token', authController.refreshToken);

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', authController.resetPassword);

// GET /api/auth/me - Get current user profile
router.get('/me', authenticate, authController.getProfile);

module.exports = router; 