const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletter.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Subscribe to newsletter
router.post('/subscribe', newsletterController.subscribe);

// Unsubscribe from newsletter
router.post('/unsubscribe', newsletterController.unsubscribe);

// Get all newsletter subscribers (admin only)
router.get('/subscribers', authenticate, authorize(['admin']), newsletterController.getSubscribers);

module.exports = router; 