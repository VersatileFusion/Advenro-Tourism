/**
 * Email sending utility for the application
 * Uses nodemailer to send emails
 */

const nodemailer = require('nodemailer');

/**
 * Send an email using nodemailer
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Email text body
 * @param {string} [options.html] - Email HTML body (optional)
 * @returns {Promise<boolean>} - A promise that resolves to true if email sent successfully
 */
const sendEmail = async (options) => {
  // If running in test environment, just return success without sending
  if (process.env.NODE_ENV === 'test') {
    return Promise.resolve(true);
  }

  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || ''
    }
  });

  // Define email options
  const mailOptions = {
    from: `${process.env.FROM_NAME || 'Advenro Tourism'} <${process.env.FROM_EMAIL || 'noreply@advenro.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  // Send email
  await transporter.sendMail(mailOptions);
  
  return true;
};

module.exports = sendEmail; 