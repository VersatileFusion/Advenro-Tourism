const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');
const { authenticate } = require('../middleware/auth');
const admin = require('../middleware/admin');

// Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if already subscribed
    const existingSubscription = await Newsletter.findOne({ email });
    if (existingSubscription) {
      return res.status(400).json({ message: 'Email already subscribed' });
    }

    const subscription = new Newsletter({
      email,
      status: 'active'
    });

    await subscription.save();
    res.status(201).json({ message: 'Successfully subscribed to newsletter' });
  } catch (error) {
    res.status(400).json({ message: 'Error subscribing to newsletter' });
  }
});

// Unsubscribe from newsletter
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const subscription = await Newsletter.findOne({ email });
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    subscription.status = 'unsubscribed';
    await subscription.save();

    res.json({ message: 'Successfully unsubscribed from newsletter' });
  } catch (error) {
    res.status(400).json({ message: 'Error unsubscribing from newsletter' });
  }
});

// Get all subscribers (admin only)
router.get('/subscribers', [authenticate, admin], async (req, res) => {
  try {
    const subscribers = await Newsletter.find({ status: 'active' })
      .sort({ createdAt: -1 });
    res.json(subscribers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscribers' });
  }
});

// Send newsletter (admin only)
router.post('/send', [authenticate, admin], async (req, res) => {
  try {
    const { subject, content } = req.body;

    if (!subject || !content) {
      return res.status(400).json({ message: 'Subject and content are required' });
    }

    // Get all active subscribers
    const subscribers = await Newsletter.find({ status: 'active' });
    if (subscribers.length === 0) {
      return res.status(400).json({ message: 'No active subscribers found' });
    }

    // TODO: Implement email sending logic here
    // For now, just return success
    res.json({ message: 'Newsletter sent successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error sending newsletter' });
  }
});

module.exports = router; 