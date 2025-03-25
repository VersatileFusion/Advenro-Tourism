const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { processPayment, processRefund } = require('../utils/payment');

// Create payment intent
router.post('/create-intent', authenticate, async (req, res) => {
    try {
        const { amount, currency } = req.body;
        const result = await processPayment(amount, currency);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating payment intent',
            error: error.message
        });
    }
});

// Confirm payment
router.post('/confirm', authenticate, async (req, res) => {
    try {
        const { amount, currency, paymentMethodId } = req.body;
        const result = await processPayment(amount, currency, paymentMethodId);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error confirming payment',
            error: error.message
        });
    }
});

// Process refund
router.post('/refund', authenticate, async (req, res) => {
    try {
        const { paymentIntentId, amount } = req.body;
        const result = await processRefund(paymentIntentId, amount);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error processing refund',
            error: error.message
        });
    }
});

module.exports = router; 