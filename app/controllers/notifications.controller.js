/**
 * Notifications Controller
 * Handles user notifications
 */

// Mock notifications data
const notifications = [
  {
    id: 'notif_1',
    userId: 'user_123',
    type: 'booking',
    title: 'Booking Confirmed',
    message: 'Your booking #1234 has been confirmed',
    data: {
      bookingId: 'booking_1'
    },
    read: false,
    createdAt: '2024-03-01T12:40:21Z'
  },
  {
    id: 'notif_2',
    userId: 'user_123',
    type: 'payment',
    title: 'Payment Received',
    message: 'We have received your payment of $599.99',
    data: {
      paymentId: 'payment_1',
      bookingId: 'booking_1'
    },
    read: true,
    createdAt: '2024-03-01T12:45:30Z'
  },
  {
    id: 'notif_3',
    userId: 'user_123',
    type: 'system',
    title: 'Welcome to Advenro',
    message: 'Thanks for joining Advenro. Start exploring destinations now!',
    data: {},
    read: false,
    createdAt: '2024-02-29T10:15:08Z'
  }
];

// Mock notification settings
const notificationSettings = {
  'user_123': {
    email: true,
    push: true,
    sms: false,
    marketing: false,
    types: {
      booking: true,
      payment: true,
      system: true,
      marketing: false
    }
  },
  'user_456': {
    email: true,
    push: false,
    sms: false,
    marketing: true,
    types: {
      booking: true,
      payment: true,
      system: true,
      marketing: true
    }
  }
};

// Access to the WebSocketHandler
let webSocketHandler;

// Set WebSocketHandler instance
exports.setWebSocketHandler = (handler) => {
  webSocketHandler = handler;
};

/**
 * Get notifications for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const { read, type, page = 1, limit = 20 } = req.query;
    
    // In production, fetch from database
    let userNotifications = notifications.filter(n => n.userId === req.user.id);
    
    // Apply filters
    if (read !== undefined) {
      const isRead = read === 'true';
      userNotifications = userNotifications.filter(n => n.read === isRead);
    }
    
    if (type) {
      userNotifications = userNotifications.filter(n => n.type === type);
    }
    
    // Sort by date (newest first)
    userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedNotifications = userNotifications.slice(startIndex, endIndex);
    
    res.status(200).json({
      success: true,
      count: userNotifications.length,
      page: parseInt(page),
      totalPages: Math.ceil(userNotifications.length / limit),
      data: paginatedNotifications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notifications as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids)) {
      const error = new Error('Invalid request. Expected array of notification IDs');
      error.status = 400;
      error.code = 'INVALID_REQUEST';
      throw error;
    }
    
    // In production, update database
    let updatedCount = 0;
    ids.forEach(id => {
      const notification = notifications.find(n => n.id === id && n.userId === req.user.id);
      if (notification && !notification.read) {
        notification.read = true;
        updatedCount++;
      }
    });
    
    // Notify via WebSocket if notifications were updated
    if (updatedCount > 0 && webSocketHandler) {
      webSocketHandler.sendToUser(req.user.id, {
        type: 'notifications-updated',
        data: {
          read: ids,
          count: this.getUnreadCount(req.user.id)
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        updatedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get notification settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getSettings = async (req, res, next) => {
  try {
    // In production, fetch from database
    const settings = notificationSettings[req.user.id] || {
      email: true,
      push: true,
      sms: false,
      marketing: false,
      types: {
        booking: true,
        payment: true,
        system: true,
        marketing: false
      }
    };
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update notification settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.updateSettings = async (req, res, next) => {
  try {
    const { email, push, sms, marketing, types } = req.body;
    
    // Get existing settings or create default
    const existingSettings = notificationSettings[req.user.id] || {
      email: true,
      push: true,
      sms: false,
      marketing: false,
      types: {
        booking: true,
        payment: true,
        system: true,
        marketing: false
      }
    };
    
    // Update settings
    const updatedSettings = {
      ...existingSettings,
      ...(email !== undefined && { email }),
      ...(push !== undefined && { push }),
      ...(sms !== undefined && { sms }),
      ...(marketing !== undefined && { marketing }),
      types: {
        ...existingSettings.types,
        ...(types && types)
      }
    };
    
    // In production, save to database
    notificationSettings[req.user.id] = updatedSettings;
    
    res.status(200).json({
      success: true,
      data: updatedSettings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new notification
 * This is an internal method, not exposed as an API endpoint
 * @param {string} userId - User ID
 * @param {Object} notificationData - Notification data
 * @returns {Object} Created notification
 */
exports.createNotification = (userId, notificationData) => {
  // Validate required fields
  if (!userId || !notificationData.type || !notificationData.title || !notificationData.message) {
    throw new Error('Missing required notification fields');
  }
  
  // Create notification
  const notification = {
    id: `notif_${Date.now()}`,
    userId,
    type: notificationData.type,
    title: notificationData.title,
    message: notificationData.message,
    data: notificationData.data || {},
    read: false,
    createdAt: new Date().toISOString()
  };
  
  // In production, save to database
  notifications.push(notification);
  
  // Send via WebSocket if available
  if (webSocketHandler) {
    webSocketHandler.sendToUser(userId, {
      type: 'notification-created',
      data: notification
    });
  }
  
  return notification;
};

/**
 * Get unread notifications count for a user
 * @param {string} userId - User ID
 * @returns {number} Count of unread notifications
 */
exports.getUnreadCount = (userId) => {
  return notifications.filter(n => n.userId === userId && !n.read).length;
}; 