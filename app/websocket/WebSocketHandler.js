const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { createServer } = require('http');

class WebSocketHandler {
  constructor(server, authService) {
    this.wss = new WebSocket.Server({ noServer: true });
    this.authService = authService;
    this.clients = new Map(); // userId -> WebSocket
    this.pingInterval = 30000; // 30 seconds
    
    // Bind methods
    this.handleUpgrade = this.handleUpgrade.bind(this);
    this.handleConnection = this.handleConnection.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.broadcastSystemMessage = this.broadcastSystemMessage.bind(this);
    this.notifyBookingEvent = this.notifyBookingEvent.bind(this);
    
    // Set up server upgrade handling
    server.on('upgrade', this.handleUpgrade);
    
    // Start ping interval
    setInterval(() => {
      this.ping();
    }, this.pingInterval);
  }
  
  /**
   * Handle WebSocket upgrade request
   */
  async handleUpgrade(request, socket, head) {
    try {
      // Get token from query string
      const url = new URL(request.url, `http://${request.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (!token) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
      
      // Verify token
      const decoded = await this.authService.verifyToken(token);
      if (!decoded) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
      
      // Store user ID for later use
      request.userId = decoded.id;
      
      // Complete upgrade
      this.wss.handleUpgrade(request, socket, head, ws => {
        this.wss.emit('connection', ws, request);
      });
      
    } catch (error) {
      console.error('WebSocket upgrade error:', error);
      socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
      socket.destroy();
    }
  }
  
  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, request) {
    const { userId } = request;
    
    // Store client connection
    this.clients.set(userId, ws);
    
    // Set up event handlers
    ws.on('message', data => this.handleMessage(userId, data));
    ws.on('close', () => this.handleClose(userId));
    ws.on('error', error => {
      console.error(`WebSocket error for user ${userId}:`, error);
      ws.terminate();
    });
    
    // Send welcome message
    this.sendToUser(userId, {
      type: 'system',
      action: 'welcome',
      data: {
        timestamp: new Date(),
        message: 'Connected to Advenro real-time service'
      }
    });
    
    console.log(`User ${userId} connected to WebSocket`);
  }
  
  /**
   * Handle incoming WebSocket message
   */
  async handleMessage(userId, data) {
    try {
      const message = JSON.parse(data);
      
      // Handle system messages
      if (message.type === 'system') {
        await this.handleSystemMessage(userId, message);
        return;
      }
      
      // Handle other message types
      switch (message.type) {
        case 'booking:update':
          await this.handleBookingUpdate(userId, message.data);
          break;
          
        case 'notification:read':
          await this.handleNotificationRead(userId, message.data);
          break;
          
        case 'chat:message':
          await this.handleChatMessage(userId, message.data);
          break;
          
        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
      
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      this.sendToUser(userId, {
        type: 'error',
        error: error.message,
        message: 'Failed to process message'
      });
    }
  }
  
  /**
   * Handle system messages
   */
  async handleSystemMessage(userId, message) {
    switch (message.action) {
      case 'pong':
        const client = this.clients.get(userId);
        if (client) {
          client.isAlive = true;
        }
        break;
        
      default:
        console.warn(`Unknown system action: ${message.action}`);
    }
  }
  
  /**
   * Handle booking updates from user actions
   */
  async handleBookingUpdate(userId, data) {
    // Notify relevant users about booking changes
    const affectedUserIds = await this.getAffectedUsers(data.bookingId);
    
    affectedUserIds.forEach(affectedUserId => {
      this.sendToUser(affectedUserId, {
        type: 'booking-updated',
        data: {
          bookingId: data.bookingId,
          status: data.status,
          timestamp: new Date()
        }
      });
    });
  }

  /**
   * Handle notification read status updates
   */
  async handleNotificationRead(userId, data) {
    // Handle read status of notifications
    if (data.ids && Array.isArray(data.ids)) {
      // In a real implementation, update notification read status in database
      console.log(`User ${userId} marked notifications as read: ${data.ids.join(', ')}`);
    }
  }
  
  /**
   * Handle chat messages
   */
  async handleChatMessage(userId, data) {
    // Implementation for chat functionality
    // This is a placeholder for future chat feature
  }
  
  /**
   * Handle client disconnection
   */
  handleClose(userId) {
    this.clients.delete(userId);
    console.log(`User ${userId} disconnected from WebSocket`);
  }
  
  /**
   * Send message to specific user
   */
  sendToUser(userId, message) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
  
  /**
   * Broadcast message to all connected clients
   */
  broadcast(message, excludeUserId = null) {
    this.clients.forEach((client, userId) => {
      if (userId !== excludeUserId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
  
  /**
   * Broadcast system message
   */
  broadcastSystemMessage(action, data) {
    this.broadcast({
      type: 'system',
      action,
      data: {
        ...data,
        timestamp: new Date()
      }
    });
  }
  
  /**
   * Check connection health
   */
  ping() {
    this.clients.forEach((client, userId) => {
      if (client.isAlive === false) {
        console.log(`Terminating inactive connection for user ${userId}`);
        client.terminate();
        return;
      }
      
      client.isAlive = false;
      client.send(JSON.stringify({
        type: 'system',
        action: 'ping'
      }));
    });
  }

  /**
   * Notify users about booking events
   * This should be called from controllers after booking changes
   * @param {string} eventType - Event type (created, updated, cancelled)
   * @param {Object} bookingData - Booking data
   */
  notifyBookingEvent(eventType, bookingData) {
    if (!bookingData || !bookingData.userId) {
      console.error('Invalid booking data for WebSocket notification');
      return;
    }

    // Get the type for the event
    let type;
    switch (eventType) {
      case 'created':
        type = 'booking-created';
        break;
      case 'updated':
        type = 'booking-updated';
        break;
      case 'cancelled':
        type = 'booking-cancelled';
        break;
      default:
        type = 'booking-event';
    }

    // Send to booking owner
    this.sendToUser(bookingData.userId, {
      type,
      data: bookingData
    });

    // If there are other affected users (like staff), send to them too
    this.getAffectedUsers(bookingData.id)
      .then(userIds => {
        userIds.forEach(userId => {
          if (userId !== bookingData.userId) {
            this.sendToUser(userId, {
              type,
              data: bookingData
            });
          }
        });
      })
      .catch(error => console.error('Error getting affected users:', error));
  }
  
  /**
   * Get users affected by a booking update
   * @param {string} bookingId - Booking ID
   * @returns {Promise<string[]>} - Array of user IDs
   */
  async getAffectedUsers(bookingId) {
    // In a real implementation, query database to get users who should be notified
    // like booking owner, hotel staff, etc.
    // For now, return empty array as mock implementation
    return [];
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
    }
    
    this.clients.forEach((client) => {
      try {
        client.terminate();
      } catch (error) {
        console.error('Error terminating client:', error);
      }
    });
    
    this.clients.clear();
  }
}

module.exports = WebSocketHandler; 