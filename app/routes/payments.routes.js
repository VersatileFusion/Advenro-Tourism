/**
 * Payment Routes
 */
const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments.controller');
const { authenticate } = require('../middleware/auth.middleware');

// POST /api/payments/create-intent - Create payment intent
router.post('/create-intent', authenticate, paymentsController.createPaymentIntent);

// POST /api/payments/confirm - Confirm payment
router.post('/confirm', authenticate, paymentsController.confirmPayment);

// GET /api/payments/methods - Get saved payment methods
router.get('/methods', authenticate, paymentsController.getPaymentMethods);

// GET /api/payments/history - Get payment history
router.get('/history', authenticate, paymentsController.getPaymentHistory);

// POST /api/payments/:id/refund - Refund a payment
router.post('/:id/refund', authenticate, paymentsController.refundPayment);

module.exports = router; 