/**
 * Support Controller
 * Handles support tickets, FAQs, and help center functionality
 */

// Mock FAQ data
const faqs = [
  {
    id: 'faq_001',
    question: 'How do I cancel a booking?',
    answer: 'You can cancel a booking by going to your bookings page, selecting the booking you wish to cancel, and clicking the "Cancel Booking" button. Please note that cancellation policies vary depending on the type of booking and the provider\'s terms and conditions.',
    category: 'Bookings',
    order: 1
  },
  {
    id: 'faq_002',
    question: 'What payment methods do you accept?',
    answer: 'We accept Visa, Mastercard, American Express, PayPal, and Apple Pay. All payment information is securely processed and we do not store your credit card details.',
    category: 'Payments',
    order: 1
  },
  {
    id: 'faq_003',
    question: 'How do I change or update my account information?',
    answer: 'You can update your account information by going to your profile page and clicking on the "Edit Profile" button. From there, you can change your personal details, contact information, and password.',
    category: 'Account',
    order: 1
  },
  {
    id: 'faq_004',
    question: 'What should I do if I didn\'t receive my booking confirmation?',
    answer: 'If you haven\'t received your booking confirmation within 15 minutes of making your booking, please check your spam or junk folder first. If you still can\'t find it, you can view your booking details in your account under "My Bookings". If your booking doesn\'t appear there, please contact our customer support team.',
    category: 'Bookings',
    order: 2
  },
  {
    id: 'faq_005',
    question: 'How do I contact customer support?',
    answer: 'You can contact our customer support team through the "Contact Us" page on our website, by sending an email to support@advenro.com, or by calling our support hotline at +1-800-123-4567. Our support team is available 24/7 to assist you.',
    category: 'General',
    order: 1
  }
];

// Mock FAQ categories
const faqCategories = [
  { id: 'cat_001', name: 'Bookings', count: 15 },
  { id: 'cat_002', name: 'Payments', count: 8 },
  { id: 'cat_003', name: 'Account', count: 12 },
  { id: 'cat_004', name: 'General', count: 10 },
  { id: 'cat_005', name: 'Hotels', count: 7 },
  { id: 'cat_006', name: 'Flights', count: 9 },
  { id: 'cat_007', name: 'Tours', count: 6 }
];

// Mock support tickets data
const supportTickets = [
  {
    id: 'ticket_001',
    userId: 'user_123',
    subject: 'Unable to modify my booking',
    message: 'I\'m trying to change the dates for my hotel booking but I\'m getting an error. The booking ID is HB-12345.',
    status: 'open',
    priority: 'medium',
    category: 'Bookings',
    createdAt: '2023-06-20T14:35:00Z',
    updatedAt: '2023-06-20T14:35:00Z',
    replies: []
  },
  {
    id: 'ticket_002',
    userId: 'user_124',
    subject: 'Charge appears twice on my credit card',
    message: 'I was charged twice for my flight booking FB-67890. Please help resolve this issue.',
    status: 'in-progress',
    priority: 'high',
    category: 'Payments',
    createdAt: '2023-06-19T10:15:00Z',
    updatedAt: '2023-06-19T15:20:00Z',
    replies: [
      {
        id: 'reply_001',
        agentId: 'agent_001',
        agentName: 'Support Agent',
        message: 'Thank you for bringing this to our attention. We are investigating the duplicate charge and will get back to you within 24 hours.',
        createdAt: '2023-06-19T15:20:00Z'
      }
    ]
  }
];

/**
 * Get FAQs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getFaqs = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    
    let result = [...faqs];
    
    // Filter by category if provided
    if (category) {
      result = result.filter(faq => faq.category.toLowerCase() === category.toLowerCase());
    }
    
    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(faq => 
        faq.question.toLowerCase().includes(searchLower) || 
        faq.answer.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by category and order
    result.sort((a, b) => {
      if (a.category === b.category) {
        return a.order - b.order;
      }
      return a.category.localeCompare(b.category);
    });
    
    res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get FAQ categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getFaqCategories = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      count: faqCategories.length,
      data: faqCategories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new support ticket
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.createTicket = async (req, res, next) => {
  try {
    const { subject, message, category } = req.body;
    
    // Validate required fields
    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Subject and message are required'
      });
    }
    
    // Create new ticket
    const newTicket = {
      id: `ticket_${Date.now()}`,
      userId: req.user.id,
      subject,
      message,
      status: 'open',
      priority: 'medium', // Default priority
      category: category || 'General',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replies: []
    };
    
    // Add to tickets collection
    supportTickets.push(newTicket);
    
    res.status(201).json({
      success: true,
      data: newTicket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's support tickets
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getUserTickets = async (req, res, next) => {
  try {
    // Find tickets for the authenticated user
    const userTickets = supportTickets.filter(ticket => ticket.userId === req.user.id);
    
    // Sort by creation date (newest first)
    userTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.status(200).json({
      success: true,
      count: userTickets.length,
      data: userTickets
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get support ticket details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getTicketDetails = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    
    // Find the ticket
    const ticket = supportTickets.find(t => t.id === ticketId);
    
    if (!ticket) {
      const error = new Error('Ticket not found');
      error.status = 404;
      error.code = 'TICKET_NOT_FOUND';
      throw error;
    }
    
    // Verify the ticket belongs to the user
    if (ticket.userId !== req.user.id && !req.user.isAdmin) {
      const error = new Error('Unauthorized');
      error.status = 403;
      error.code = 'UNAUTHORIZED';
      throw error;
    }
    
    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reply to a support ticket
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.replyToTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    
    // Validate message
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }
    
    // Find the ticket
    const ticketIndex = supportTickets.findIndex(t => t.id === ticketId);
    
    if (ticketIndex === -1) {
      const error = new Error('Ticket not found');
      error.status = 404;
      error.code = 'TICKET_NOT_FOUND';
      throw error;
    }
    
    const ticket = supportTickets[ticketIndex];
    
    // Verify the ticket belongs to the user (or user is admin)
    if (ticket.userId !== req.user.id && !req.user.isAdmin) {
      const error = new Error('Unauthorized');
      error.status = 403;
      error.code = 'UNAUTHORIZED';
      throw error;
    }
    
    // Check if ticket is closed
    if (ticket.status === 'closed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot reply to a closed ticket'
      });
    }
    
    // Create reply
    const reply = {
      id: `reply_${Date.now()}`,
      userId: req.user.id,
      userName: req.user.name || req.user.username,
      message,
      createdAt: new Date().toISOString()
    };
    
    // Add reply to ticket
    ticket.replies.push(reply);
    
    // Update ticket status and timestamp
    ticket.status = 'in-progress';
    ticket.updatedAt = new Date().toISOString();
    
    // Update ticket in collection
    supportTickets[ticketIndex] = ticket;
    
    res.status(200).json({
      success: true,
      data: reply
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Close a support ticket
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.closeTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    
    // Find the ticket
    const ticketIndex = supportTickets.findIndex(t => t.id === ticketId);
    
    if (ticketIndex === -1) {
      const error = new Error('Ticket not found');
      error.status = 404;
      error.code = 'TICKET_NOT_FOUND';
      throw error;
    }
    
    const ticket = supportTickets[ticketIndex];
    
    // Verify the ticket belongs to the user (or user is admin)
    if (ticket.userId !== req.user.id && !req.user.isAdmin) {
      const error = new Error('Unauthorized');
      error.status = 403;
      error.code = 'UNAUTHORIZED';
      throw error;
    }
    
    // Check if ticket is already closed
    if (ticket.status === 'closed') {
      return res.status(400).json({
        success: false,
        error: 'Ticket is already closed'
      });
    }
    
    // Update ticket status and timestamp
    ticket.status = 'closed';
    ticket.updatedAt = new Date().toISOString();
    
    // Update ticket in collection
    supportTickets[ticketIndex] = ticket;
    
    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get contact information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getContactInfo = async (req, res, next) => {
  try {
    // Mock contact information
    const contactInfo = {
      email: 'support@advenro.com',
      phone: '+1-800-123-4567',
      hours: 'Available 24/7',
      address: {
        street: '123 Adventure St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'USA'
      },
      socialMedia: {
        facebook: 'https://facebook.com/advenro',
        twitter: 'https://twitter.com/advenro',
        instagram: 'https://instagram.com/advenro'
      }
    };
    
    res.status(200).json({
      success: true,
      data: contactInfo
    });
  } catch (error) {
    next(error);
  }
}; 