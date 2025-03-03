const nodemailer = require('nodemailer');
const twilio = require('twilio');
const webpush = require('web-push');
const User = require('../models/User');

// Configure email transport
const emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
    }
});

// Configure SMS client
const smsClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Configure Web Push
webpush.setVapidDetails(
    'mailto:' + process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// Send email notification
exports.sendEmail = async (to, subject, message, template = 'default') => {
    try {
        const mailOptions = {
            from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
            to,
            subject,
            html: await getEmailTemplate(template, { message })
        };

        await emailTransporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email notification error:', error);
        return false;
    }
};

// Send SMS notification
exports.sendSMS = async (to, message) => {
    try {
        await smsClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to
        });
        return true;
    } catch (error) {
        console.error('SMS notification error:', error);
        return false;
    }
};

// Send push notification
exports.sendPushNotification = async (subscription, title, body, data = {}) => {
    try {
        await webpush.sendNotification(
            subscription,
            JSON.stringify({
                title,
                body,
                data
            })
        );
        return true;
    } catch (error) {
        console.error('Push notification error:', error);
        return false;
    }
};

// Send notification to user through their preferred channels
exports.notifyUser = async (userId, notification) => {
    try {
        const user = await User.findById(userId);
        if (!user) return false;

        const { title, message, type, data } = notification;

        // Send email if enabled
        if (user.preferences.notifications.email) {
            await exports.sendEmail(
                user.email,
                title,
                message,
                type
            );
        }

        // Send SMS if enabled and phone number exists
        if (user.preferences.notifications.sms && user.phone) {
            await exports.sendSMS(
                user.phone,
                message
            );
        }

        // Send push notification if subscription exists
        if (user.pushSubscription) {
            await exports.sendPushNotification(
                user.pushSubscription,
                title,
                message,
                data
            );
        }

        return true;
    } catch (error) {
        console.error('User notification error:', error);
        return false;
    }
};

// Get email template
const getEmailTemplate = async (template, data) => {
    // In a real application, you would load HTML templates from files
    // For now, we'll use a simple switch statement
    switch (template) {
        case 'welcome':
            return `
                <h1>Welcome to Tourism App!</h1>
                <p>${data.message}</p>
                <p>Start exploring amazing destinations today!</p>
            `;
        case 'booking':
            return `
                <h1>Booking Confirmation</h1>
                <p>${data.message}</p>
                <p>Thank you for choosing us!</p>
            `;
        case 'reminder':
            return `
                <h1>Trip Reminder</h1>
                <p>${data.message}</p>
                <p>Have a great trip!</p>
            `;
        default:
            return `
                <h1>Tourism App</h1>
                <p>${data.message}</p>
            `;
    }
}; 