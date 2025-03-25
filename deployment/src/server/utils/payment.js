// Mock payment processor for testing
const mockPaymentProcessor = {
    createPaymentIntent: async (amount, currency = 'usd') => {
        return {
            id: 'mock_payment_intent_' + Date.now(),
            amount,
            currency,
            status: 'requires_payment_method'
        };
    },
    confirmPayment: async (paymentIntentId, paymentMethodId) => {
        return {
            id: paymentIntentId,
            status: 'succeeded',
            paymentMethod: paymentMethodId
        };
    },
    refundPayment: async (paymentIntentId, amount) => {
        return {
            id: 'mock_refund_' + Date.now(),
            paymentIntent: paymentIntentId,
            amount,
            status: 'succeeded'
        };
    }
};

// Process payment
const processPayment = async (amount, currency = 'usd', paymentMethodId) => {
    try {
        // Create payment intent
        const paymentIntent = await mockPaymentProcessor.createPaymentIntent(amount, currency);

        // Confirm payment
        if (paymentMethodId) {
            const confirmedPayment = await mockPaymentProcessor.confirmPayment(
                paymentIntent.id,
                paymentMethodId
            );
            return {
                success: true,
                data: confirmedPayment
            };
        }

        return {
            success: true,
            data: paymentIntent
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

// Process refund
const processRefund = async (paymentIntentId, amount) => {
    try {
        const refund = await mockPaymentProcessor.refundPayment(paymentIntentId, amount);
        return {
            success: true,
            data: refund
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    processPayment,
    processRefund
}; 