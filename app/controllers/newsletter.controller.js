const { v4: uuidv4 } = require('uuid');
const Newsletter = require('../models/newsletter.model');
const { validateEmail } = require('../utils/validation');

/**
 * Subscribe a user to the newsletter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Check if email already exists
    let subscriber = await Newsletter.findByEmail(email);

    if (subscriber) {
      // If previously unsubscribed, reactivate
      if (subscriber.status === 'unsubscribed') {
        await Newsletter.updateSubscription(subscriber.id, { status: 'active' });
        
        return res.json({
          success: true,
          message: 'You have been re-subscribed to our newsletter'
        });
      }
      
      // Already subscribed
      return res.json({
        success: true,
        message: 'This email is already subscribed to our newsletter'
      });
    }

    // Create new subscription
    const newSubscriber = {
      id: uuidv4(),
      email,
      status: 'active',
      subscribedAt: new Date().toISOString()
    };

    await Newsletter.create(newSubscriber);

    // In a real application, you would send a welcome email here

    return res.status(201).json({
      success: true,
      message: 'Thank you for subscribing to our newsletter!'
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to subscribe to the newsletter'
    });
  }
};

/**
 * Unsubscribe from the newsletter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Check if email exists
    const subscriber = await Newsletter.findByEmail(email);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'This email address is not in our subscriber list'
      });
    }

    // Update subscription status
    await Newsletter.updateSubscription(subscriber.id, { status: 'unsubscribed' });

    return res.json({
      success: true,
      message: 'You have been successfully unsubscribed from our newsletter'
    });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe from the newsletter'
    });
  }
};

/**
 * Get all newsletter subscribers (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSubscribers = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    // Get total count and subscribers
    const { total, subscribers } = await Newsletter.getAll({
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    // Calculate pagination
    const totalPages = Math.ceil(total / parseInt(limit));
    
    return res.json({
      success: true,
      data: {
        subscribers,
        pagination: {
          total,
          page: parseInt(page),
          totalPages,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get newsletter subscribers error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve newsletter subscribers'
    });
  }
};