const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const handlebars = require('handlebars');
const logger = require('./loggingService');
const cache = require('./cacheService');

class MailerService {
    constructor() {
        this.templateCache = new Map();
        this.setupTransport();
    }

    setupTransport() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Verify connection configuration
        this.transporter.verify((error) => {
            if (error) {
                logger.error('SMTP connection error', error);
            } else {
                logger.info('SMTP connection established');
            }
        });
    }

    async loadTemplate(templateName) {
        try {
            // Check cache first
            const cachedTemplate = await cache.get(`email_template:${templateName}`);
            if (cachedTemplate) {
                return handlebars.compile(cachedTemplate);
            }

            // Load template from file
            const templatePath = path.join(process.cwd(), 'src', 'templates', 'emails', `${templateName}.hbs`);
            const templateContent = await fs.readFile(templatePath, 'utf-8');
            
            // Cache template for 1 hour
            await cache.set(`email_template:${templateName}`, templateContent, 3600);
            
            return handlebars.compile(templateContent);
        } catch (error) {
            logger.error('Error loading email template', error);
            throw new Error(`Failed to load email template: ${templateName}`);
        }
    }

    async sendMail(options) {
        try {
            const { to, subject, template, context, attachments } = options;

            // Load and compile template
            const compiledTemplate = await this.loadTemplate(template);
            const html = compiledTemplate(context);

            const mailOptions = {
                from: process.env.SMTP_FROM,
                to,
                subject,
                html,
                attachments
            };

            const info = await this.transporter.sendMail(mailOptions);

            logger.info('Email sent successfully', {
                messageId: info.messageId,
                to,
                subject,
                template
            });

            return info;
        } catch (error) {
            logger.error('Error sending email', error);
            throw new Error('Failed to send email');
        }
    }

    async sendWelcomeEmail(user) {
        try {
            await this.sendMail({
                to: user.email,
                subject: 'Welcome to Advenro!',
                template: 'welcome',
                context: {
                    name: user.name,
                    verificationLink: `${process.env.APP_URL}/verify-email?token=${user.verificationToken}`
                }
            });
        } catch (error) {
            logger.error('Error sending welcome email', error);
            throw new Error('Failed to send welcome email');
        }
    }

    async sendBookingConfirmation(booking, user) {
        try {
            await this.sendMail({
                to: user.email,
                subject: 'Booking Confirmation',
                template: 'booking-confirmation',
                context: {
                    name: user.name,
                    bookingId: booking._id,
                    bookingDetails: booking,
                    manageBookingLink: `${process.env.APP_URL}/bookings/${booking._id}`
                }
            });
        } catch (error) {
            logger.error('Error sending booking confirmation', error);
            throw new Error('Failed to send booking confirmation');
        }
    }

    async sendPaymentConfirmation(payment, user) {
        try {
            await this.sendMail({
                to: user.email,
                subject: 'Payment Confirmation',
                template: 'payment-confirmation',
                context: {
                    name: user.name,
                    amount: payment.amount,
                    currency: payment.currency,
                    paymentId: payment.id,
                    date: new Date().toLocaleDateString()
                }
            });
        } catch (error) {
            logger.error('Error sending payment confirmation', error);
            throw new Error('Failed to send payment confirmation');
        }
    }

    async sendPasswordReset(user, resetToken) {
        try {
            await this.sendMail({
                to: user.email,
                subject: 'Password Reset Request',
                template: 'password-reset',
                context: {
                    name: user.name,
                    resetLink: `${process.env.APP_URL}/reset-password?token=${resetToken}`
                }
            });
        } catch (error) {
            logger.error('Error sending password reset email', error);
            throw new Error('Failed to send password reset email');
        }
    }

    async sendTourReminder(booking, user) {
        try {
            await this.sendMail({
                to: user.email,
                subject: 'Your Tour is Coming Up!',
                template: 'tour-reminder',
                context: {
                    name: user.name,
                    tourName: booking.tour.name,
                    startDate: new Date(booking.startDate).toLocaleDateString(),
                    meetingPoint: booking.tour.meetingPoint,
                    tourGuide: booking.tour.guide,
                    emergencyContact: booking.tour.emergencyContact
                }
            });
        } catch (error) {
            logger.error('Error sending tour reminder', error);
            throw new Error('Failed to send tour reminder');
        }
    }

    async sendCancellationConfirmation(booking, user) {
        try {
            await this.sendMail({
                to: user.email,
                subject: 'Booking Cancellation Confirmation',
                template: 'booking-cancellation',
                context: {
                    name: user.name,
                    bookingId: booking._id,
                    refundAmount: booking.refundAmount,
                    cancellationDate: new Date().toLocaleDateString()
                }
            });
        } catch (error) {
            logger.error('Error sending cancellation confirmation', error);
            throw new Error('Failed to send cancellation confirmation');
        }
    }
}

module.exports = new MailerService(); 