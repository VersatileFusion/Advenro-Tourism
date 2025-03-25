const nodemailer = require('nodemailer');

// Create a test transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.test.com',
  port: 587,
  secure: false,
  auth: {
    user: 'test@example.com',
    pass: 'test-password'
  }
});

// Mock sendEmail function for testing
const sendEmail = async ({ to, subject, html }) => {
  try {
    // In test environment, just log the email details
    console.log('📧 Sending email:', { to, subject });
    return { messageId: 'test-message-id' };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  transporter
}; 