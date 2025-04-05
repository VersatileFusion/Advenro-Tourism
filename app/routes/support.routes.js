/**
 * Support Routes
 * Defines API routes for support-related operations
 */

const express = require('express');
const supportController = require('../controllers/support.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/faqs', supportController.getFaqs);
router.get('/faqs/categories', supportController.getFaqCategories);
router.get('/contact', supportController.getContactInfo);

// Protected routes - require authentication
router.post('/tickets', authenticate, supportController.createTicket);
router.get('/tickets', authenticate, supportController.getUserTickets);
router.get('/tickets/:ticketId', authenticate, supportController.getTicketDetails);
router.post('/tickets/:ticketId/reply', authenticate, supportController.replyToTicket);
router.patch('/tickets/:ticketId/close', authenticate, supportController.closeTicket);

module.exports = router; 