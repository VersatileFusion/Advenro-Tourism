/**
 * Payments Controller
 * Handles payment-related requests
 */

// Mock payments data
const payments = [
  {
    id: 'payment_1',
    userId: 'user_123',
    bookingId: 'booking_1',
    amount: 599.99,
    currency: 'USD',
    status: 'completed',
    paymentMethod: 'credit_card',
    paymentMethodDetails: {
      brand: 'visa',
      last4: '4242'
    },
    createdAt: '2024-03-01T12:35:22Z'
  },
  {
    id: 'payment_2',
    userId: 'user_123',
    bookingId: 'booking_2',
    amount: 350.50,
    currency: 'USD',
    status: 'pending',
    paymentMethod: 'credit_card',
    paymentMethodDetails: {
      brand: 'mastercard',
      last4: '1234'
    },
    createdAt: '2024-03-15T09:25:40Z'
  }
];

/**
 * Create payment intent
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    
    // In production, validate booking and fetch details
    // Mock implementation
    const intentId = `pi_${Date.now()}`;
    const clientSecret = `sk_test_${Date.now()}_secret`;
    
    res.status(200).json({
      success: true,
      data: {
        intentId,
        clientSecret,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy',
        amount: 599.99,
        currency: 'USD'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId, bookingId } = req.body;
    
    // In production, confirm payment with payment provider
    // Mock implementation
    const newPayment = {
      id: `payment_${Date.now()}`,
      userId: req.user.id,
      bookingId,
      amount: 599.99,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'credit_card',
      paymentMethodDetails: {
        brand: 'visa',
        last4: '4242'
      },
      createdAt: new Date().toISOString()
    };
    
    // Mock saving to database
    payments.push(newPayment);
    
    res.status(200).json({
      success: true,
      data: newPayment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get saved payment methods
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getPaymentMethods = async (req, res, next) => {
  try {
    // Mock payment methods
    const paymentMethods = [
      {
        id: 'pm_1',
        type: 'card',
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2025,
        isDefault: true
      },
      {
        id: 'pm_2',
        type: 'card',
        brand: 'mastercard',
        last4: '1234',
        expMonth: 3,
        expYear: 2026,
        isDefault: false
      }
    ];
    
    res.status(200).json({
      success: true,
      data: paymentMethods
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getPaymentHistory = async (req, res, next) => {
  try {
    // In production, fetch from database filtering by user ID
    const userPayments = payments.filter(payment => payment.userId === req.user.id);
    
    res.status(200).json({
      success: true,
      count: userPayments.length,
      data: userPayments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refund a payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.refundPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    
    // In production, find payment and process refund
    const paymentIndex = payments.findIndex(p => p.id === id && p.userId === req.user.id);
    
    if (paymentIndex === -1) {
      const error = new Error('Payment not found');
      error.status = 404;
      error.code = 'PAYMENT_NOT_FOUND';
      throw error;
    }
    
    // Check if payment can be refunded
    if (payments[paymentIndex].status !== 'completed') {
      const error = new Error('Payment cannot be refunded');
      error.status = 400;
      error.code = 'PAYMENT_CANNOT_BE_REFUNDED';
      throw error;
    }
    
    // Process refund
    const refundAmount = amount || payments[paymentIndex].amount;
    
    // Create refund record
    const refund = {
      id: `refund_${Date.now()}`,
      paymentId: id,
      amount: refundAmount,
      currency: payments[paymentIndex].currency,
      reason: reason || 'requested_by_customer',
      status: 'completed',
      createdAt: new Date().toISOString()
    };
    
    // Update payment status
    payments[paymentIndex] = {
      ...payments[paymentIndex],
      status: 'refunded',
      refundId: refund.id,
      refundedAt: new Date().toISOString()
    };
    
    res.status(200).json({
      success: true,
      data: {
        payment: payments[paymentIndex],
        refund
      }
    });
  } catch (error) {
    next(error);
  }
}; 