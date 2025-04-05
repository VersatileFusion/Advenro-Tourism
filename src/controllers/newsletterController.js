const Newsletter = require('../models/newsletter');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/appResponse');

/**
 * Subscribe to the newsletter
 * @route POST /api/newsletter/subscribe
 * @access Public
 */
exports.subscribe = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  try {
    // Check if email is already subscribed
    let subscriber = await Newsletter.findOne({ email });

    if (subscriber) {
      // If previously unsubscribed, reactivate
      if (subscriber.status === 'unsubscribed') {
        subscriber.status = 'active';
        await subscriber.save();
        return sendSuccessResponse(
          res,
          subscriber,
          'Successfully re-subscribed to the newsletter'
        );
      }
      // Already subscribed
      return sendSuccessResponse(
        res,
        subscriber,
        'Email is already subscribed to the newsletter'
      );
    }

    // Create new subscription
    subscriber = await Newsletter.create({ email });

    // In a real application, you might want to:
    // 1. Send a welcome email
    // 2. Add the subscriber to your email marketing platform
    // 3. Implement double opt-in by sending a confirmation link

    return sendSuccessResponse(
      res,
      subscriber,
      'Successfully subscribed to the newsletter'
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return next(new AppError('Failed to subscribe to the newsletter', 500));
  }
});

/**
 * Unsubscribe from the newsletter
 * @route POST /api/newsletter/unsubscribe
 * @access Public
 */
exports.unsubscribe = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  try {
    const subscriber = await Newsletter.findOne({ email });

    if (!subscriber) {
      return next(new AppError('Email not found in our subscribers list', 404));
    }

    // Update status to unsubscribed
    subscriber.status = 'unsubscribed';
    await subscriber.save();

    return sendSuccessResponse(
      res,
      { email },
      'Successfully unsubscribed from the newsletter'
    );
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return next(new AppError('Failed to unsubscribe from the newsletter', 500));
  }
});

/**
 * Get all newsletter subscribers (admin only)
 * @route GET /api/newsletter/subscribers
 * @access Private/Admin
 */
exports.getSubscribers = catchAsync(async (req, res, next) => {
  try {
    const { status, sortBy = 'subscribedAt', order = 'desc', page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = {};
    if (status) query.status = status;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get subscribers
    const subscribers = await Newsletter.find(query)
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await Newsletter.countDocuments(query);
    
    return sendSuccessResponse(
      res,
      {
        subscribers,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      },
      'Newsletter subscribers retrieved successfully'
    );
  } catch (error) {
    console.error('Get subscribers error:', error);
    return next(new AppError('Failed to retrieve newsletter subscribers', 500));
  }
}); 