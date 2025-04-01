const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Booking = require("../models/Booking");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/appResponse");

/**
 * Create a payment intent using Stripe
 * @route POST /api/payments/create-payment-intent
 * @access Private
 */
exports.createPaymentIntent = catchAsync(async (req, res, next) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    return next(new AppError("Booking ID is required", 400));
  }

  // Find the booking
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    return next(new AppError("Booking not found", 404));
  }

  // Check if user owns this booking
  if (booking.user.toString() !== req.user.id) {
    return next(
      new AppError(
        "You can only create payment intents for your own bookings",
        403
      )
    );
  }

  // Check if booking is already paid
  if (booking.paymentStatus === "completed") {
    return next(new AppError("This booking has already been paid for", 400));
  }

  // Create a payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(booking.totalPrice * 100), // Convert to cents
    currency: "usd",
    metadata: {
      bookingId: booking._id.toString(),
      userId: req.user.id,
    },
  });

  return sendSuccessResponse(
    res,
    {
      clientSecret: paymentIntent.client_secret,
    },
    "Payment intent created successfully"
  );
});

/**
 * Handle Stripe webhook events
 * @route POST /api/payments/webhook
 * @access Public
 */
exports.handleWebhook = catchAsync(async (req, res, next) => {
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      await handleSuccessfulPayment(event.data.object);
      break;
    case "payment_intent.payment_failed":
      await handleFailedPayment(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return sendSuccessResponse(res, { received: true }, "Webhook received");
});

/**
 * Update booking status after successful payment
 * @param {Object} paymentIntent - Stripe payment intent object
 */
const handleSuccessfulPayment = async (paymentIntent) => {
  try {
    const { bookingId } = paymentIntent.metadata;

    if (!bookingId) {
      console.error("No booking ID found in payment intent metadata");
      return;
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      console.error(`Booking not found for ID: ${bookingId}`);
      return;
    }

    booking.paymentStatus = "completed";
    booking.status = "confirmed";
    booking.paymentId = paymentIntent.id;
    booking.paymentMethod = "card";
    booking.paymentDate = new Date();

    await booking.save();

    // You could also trigger email notifications here
    console.log(`Payment successful for booking ${bookingId}`);
  } catch (error) {
    console.error("Error processing successful payment:", error);
  }
};

/**
 * Handle failed payment
 * @param {Object} paymentIntent - Stripe payment intent object
 */
const handleFailedPayment = async (paymentIntent) => {
  try {
    const { bookingId } = paymentIntent.metadata;

    if (!bookingId) {
      console.error("No booking ID found in payment intent metadata");
      return;
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      console.error(`Booking not found for ID: ${bookingId}`);
      return;
    }

    booking.paymentStatus = "failed";
    await booking.save();

    console.log(`Payment failed for booking ${bookingId}`);
  } catch (error) {
    console.error("Error processing failed payment:", error);
  }
};
