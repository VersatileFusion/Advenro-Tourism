const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { authenticate } = require('../middleware/auth');
const admin = require('../middleware/admin');

// Create payment intent
router.post('/create-payment-intent', authenticate, async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Get booking details
    const booking = await Booking.findById(bookingId)
      .populate('hotelId', 'name price');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns the booking
    if (booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalPrice * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        bookingId,
        userId: req.user.userId
      }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(400).json({ message: 'Error creating payment intent' });
  }
});

// Confirm payment
router.post('/confirm', authenticate, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    // Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not successful' });
    }

    // Create payment record
    const payment = new Payment({
      bookingId: paymentIntent.metadata.bookingId,
      userId: paymentIntent.metadata.userId,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      status: 'succeeded',
      paymentIntentId
    });

    await payment.save();

    // Update booking status
    await Booking.findByIdAndUpdate(paymentIntent.metadata.bookingId, {
      status: 'confirmed'
    });

    res.json(payment);
  } catch (error) {
    res.status(400).json({ message: 'Error confirming payment' });
  }
});

// Get payment history
router.get('/history', authenticate, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.userId })
      .populate('bookingId', 'hotelId checkIn checkOut')
      .populate('bookingId.hotelId', 'name location')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment history' });
  }
});

// Get all payments (admin only)
router.get('/all', [authenticate, admin], async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('bookingId', 'hotelId checkIn checkOut')
      .populate('bookingId.hotelId', 'name location')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payments' });
  }
});

// Get payment by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('bookingId', 'hotelId checkIn checkOut')
      .populate('bookingId.hotelId', 'name location');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user owns the payment or is admin
    if (payment.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment' });
  }
});

// Refund payment (admin only)
router.post('/refund', [authenticate, admin], async (req, res) => {
  try {
    const { paymentId } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment cannot be refunded' });
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.paymentIntentId
    });

    // Update payment record
    payment.status = 'refunded';
    payment.refundId = refund.id;
    await payment.save();

    // Update booking status
    await Booking.findByIdAndUpdate(payment.bookingId, {
      status: 'cancelled'
    });

    res.json(payment);
  } catch (error) {
    res.status(400).json({ message: 'Error processing refund' });
  }
});

// Webhook endpoint for Stripe events
router.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        // Update booking status
        await Booking.findByIdAndUpdate(paymentIntent.metadata.bookingId, {
          status: 'confirmed'
        });

        // Create payment record
        const payment = new Payment({
          bookingId: paymentIntent.metadata.bookingId,
          userId: paymentIntent.metadata.userId,
          amount: paymentIntent.amount / 100, // Convert from cents
          currency: paymentIntent.currency,
          status: 'succeeded',
          paymentIntentId: paymentIntent.id
        });

        await payment.save();
        break;
      
      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object;
        // Handle failed payment
        await Booking.findByIdAndUpdate(failedPaymentIntent.metadata.bookingId, {
          status: 'payment_failed'
        });
        break;
        
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    res.json({received: true});
  } catch (err) {
    console.error('Error processing webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

module.exports = router; 