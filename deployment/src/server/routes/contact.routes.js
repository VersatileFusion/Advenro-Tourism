const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validate');
const { schemas } = require('../middleware/validate');
const { catchAsync } = require('../utils/error');
const { sendEmail } = require('../utils/email');

// Submit contact form
router.post('/submit', validate(schemas.contact), catchAsync(async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Send notification to admin
    await sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@example.com',
        subject: `New Contact Form Submission: ${subject}`,
        text: `
Name: ${name}
Email: ${email}
Subject: ${subject}
Message: ${message}
        `
    });

    // Send confirmation to user
    await sendEmail({
        to: email,
        subject: 'Thank you for contacting us',
        text: `
Dear ${name},

Thank you for reaching out to us. We have received your message and will get back to you as soon as possible.

Your message details:
Subject: ${subject}
Message: ${message}

Best regards,
The Team
        `
    });

    res.status(201).json({
        success: true,
        message: 'Contact form submitted successfully'
    });
}));

// Submit support ticket
router.post('/support', validate(schemas.support), catchAsync(async (req, res) => {
    const { name, email, category, priority, description } = req.body;

    // Send notification to support team
    await sendEmail({
        to: process.env.SUPPORT_EMAIL || 'support@example.com',
        subject: `New Support Ticket: ${category} - ${priority}`,
        text: `
Support Ticket Details:
Name: ${name}
Email: ${email}
Category: ${category}
Priority: ${priority}
Description: ${description}
        `
    });

    // Send confirmation to user
    await sendEmail({
        to: email,
        subject: 'Support Ticket Received',
        text: `
Dear ${name},

We have received your support ticket and our team will review it shortly.

Ticket Details:
Category: ${category}
Priority: ${priority}
Description: ${description}

We aim to respond to all support tickets within 24-48 hours.

Best regards,
Support Team
        `
    });

    res.status(201).json({
        success: true,
        message: 'Support ticket submitted successfully'
    });
}));

module.exports = router; 