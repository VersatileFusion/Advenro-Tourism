const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validate');
const { schemas } = require('../middleware/validate');
const { catchAsync } = require('../utils/error');
const { sendEmail } = require('../utils/email');

// Subscribe to newsletter
router.post('/subscribe', validate(schemas.newsletter), catchAsync(async (req, res) => {
    const { email, name } = req.body;

    // In a real application, you would:
    // 1. Check if email already exists in your newsletter database
    // 2. Add the email to your newsletter service (e.g., Mailchimp, SendGrid)
    // 3. Send a confirmation email

    // For now, we'll just simulate sending a welcome email
    await sendEmail({
        to: email,
        subject: 'Welcome to Our Newsletter!',
        text: `Hello ${name},\n\nThank you for subscribing to our newsletter! We're excited to share our latest updates with you.\n\nBest regards,\nThe Team`
    });

    res.status(201).json({
        success: true,
        message: 'Successfully subscribed to newsletter'
    });
}));

// Unsubscribe from newsletter
router.post('/unsubscribe', validate(schemas.newsletter), catchAsync(async (req, res) => {
    const { email } = req.body;

    // In a real application, you would:
    // 1. Verify the email exists in your newsletter database
    // 2. Remove the email from your newsletter service
    // 3. Send a confirmation email

    // For now, we'll just simulate sending an unsubscribe confirmation
    await sendEmail({
        to: email,
        subject: 'Newsletter Unsubscription Confirmed',
        text: 'You have been successfully unsubscribed from our newsletter. We hope to see you again!'
    });

    res.json({
        success: true,
        message: 'Successfully unsubscribed from newsletter'
    });
}));

module.exports = router; 