/**
 * Notifications Routes
 */
const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications.controller');
const { authenticate } = require('../middleware/auth.middleware');

// GET /api/notifications - Get user notifications
router.get('/', authenticate, notificationsController.getNotifications);

// PUT /api/notifications/read - Mark notifications as read
router.put('/read', authenticate, notificationsController.markAsRead);

// GET /api/notifications/settings - Get notification settings
router.get('/settings', authenticate, notificationsController.getSettings);

// PUT /api/notifications/settings - Update notification settings
router.put('/settings', authenticate, notificationsController.updateSettings);

module.exports = router; 