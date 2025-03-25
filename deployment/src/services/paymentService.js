const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('./loggingService');
const cache = require('./cacheService');

class PaymentService {
    constructor() {
        this.stripe = stripe;
    }

    async createPaymentIntent(amount, currency, metadata = {}) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: currency.toLowerCase(),
                metadata,
                automatic_payment_methods: {
                    enabled: true,
                }
            });

            logger.info('Payment intent created', {
                amount,
                currency,
                paymentIntentId: paymentIntent.id
            });

            return paymentIntent;
        } catch (error) {
            logger.error('Error creating payment intent', error);
            throw new Error('Failed to create payment intent');
        }
    }

    async confirmPayment(paymentIntentId) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
            
            logger.info('Payment confirmed', {
                paymentIntentId,
                status: paymentIntent.status
            });

            return paymentIntent;
        } catch (error) {
            logger.error('Error confirming payment', error);
            throw new Error('Failed to confirm payment');
        }
    }

    async createCustomer(email, name, metadata = {}) {
        try {
            const customer = await this.stripe.customers.create({
                email,
                name,
                metadata
            });

            logger.info('Customer created', {
                customerId: customer.id,
                email
            });

            return customer;
        } catch (error) {
            logger.error('Error creating customer', error);
            throw new Error('Failed to create customer');
        }
    }

    async attachPaymentMethod(customerId, paymentMethodId) {
        try {
            const paymentMethod = await this.stripe.paymentMethods.attach(
                paymentMethodId,
                { customer: customerId }
            );

            logger.info('Payment method attached', {
                customerId,
                paymentMethodId
            });

            return paymentMethod;
        } catch (error) {
            logger.error('Error attaching payment method', error);
            throw new Error('Failed to attach payment method');
        }
    }

    async createSubscription(customerId, priceId) {
        try {
            const subscription = await this.stripe.subscriptions.create({
                customer: customerId,
                items: [{ price: priceId }],
                expand: ['latest_invoice.payment_intent']
            });

            logger.info('Subscription created', {
                customerId,
                subscriptionId: subscription.id
            });

            return subscription;
        } catch (error) {
            logger.error('Error creating subscription', error);
            throw new Error('Failed to create subscription');
        }
    }

    async cancelSubscription(subscriptionId) {
        try {
            const subscription = await this.stripe.subscriptions.del(subscriptionId);

            logger.info('Subscription cancelled', {
                subscriptionId
            });

            return subscription;
        } catch (error) {
            logger.error('Error cancelling subscription', error);
            throw new Error('Failed to cancel subscription');
        }
    }

    async createRefund(paymentIntentId, amount = null) {
        try {
            const refundParams = {
                payment_intent: paymentIntentId
            };

            if (amount) {
                refundParams.amount = Math.round(amount * 100);
            }

            const refund = await this.stripe.refunds.create(refundParams);

            logger.info('Refund created', {
                paymentIntentId,
                refundId: refund.id,
                amount: refund.amount
            });

            return refund;
        } catch (error) {
            logger.error('Error creating refund', error);
            throw new Error('Failed to create refund');
        }
    }

    async listPaymentMethods(customerId) {
        try {
            const paymentMethods = await this.stripe.paymentMethods.list({
                customer: customerId,
                type: 'card'
            });

            // Cache payment methods for 5 minutes
            await cache.set(`payment_methods:${customerId}`, paymentMethods, 300);

            return paymentMethods;
        } catch (error) {
            logger.error('Error listing payment methods', error);
            throw new Error('Failed to list payment methods');
        }
    }

    async handleWebhook(body, signature) {
        try {
            const event = this.stripe.webhooks.constructEvent(
                body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );

            logger.info('Webhook received', {
                type: event.type,
                objectId: event.data.object.id
            });

            switch (event.type) {
                case 'payment_intent.succeeded':
                    await this.handlePaymentSuccess(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    await this.handlePaymentFailure(event.data.object);
                    break;
                case 'customer.subscription.deleted':
                    await this.handleSubscriptionCancelled(event.data.object);
                    break;
                // Add more webhook handlers as needed
            }

            return event;
        } catch (error) {
            logger.error('Webhook error', error);
            throw new Error('Webhook signature verification failed');
        }
    }

    async handlePaymentSuccess(paymentIntent) {
        // Implement payment success logic
        logger.info('Payment succeeded', {
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            customerId: paymentIntent.customer
        });
    }

    async handlePaymentFailure(paymentIntent) {
        // Implement payment failure logic
        logger.error('Payment failed', null, {
            paymentIntentId: paymentIntent.id,
            error: paymentIntent.last_payment_error,
            customerId: paymentIntent.customer
        });
    }

    async handleSubscriptionCancelled(subscription) {
        // Implement subscription cancellation logic
        logger.info('Subscription cancelled', {
            subscriptionId: subscription.id,
            customerId: subscription.customer
        });
    }
}

module.exports = new PaymentService(); 