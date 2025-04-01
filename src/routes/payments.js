const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { createPaymentIntent, handleWebhook } = require('../controllers/paymentController');

// Create payment intent (needs authentication)
router.post('/create-payment-intent', authenticate, createPaymentIntent);

// Handle Stripe webhooks (no auth required as this is called by Stripe)
router.post('/webhook', handleWebhook);

module.exports = router; 