const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const proxyquire = require('proxyquire');

// Import test setup
const { dbHelper } = require('../../config/setup');

// Create model mocks
const NotificationMock = {
  findById: sinon.stub(),
  findOne: sinon.stub(),
  find: sinon.stub(),
  create: sinon.stub(),
  findByIdAndUpdate: sinon.stub(),
  findByIdAndDelete: sinon.stub(),
  countDocuments: sinon.stub(),
  updateMany: sinon.stub()
};

const UserMock = {
  findById: sinon.stub()
};

const ErrorLogMock = {
  create: sinon.stub()
};

// Define the notification controller implementation
const notificationController = {
  // Get all notifications for a user
  getUserNotifications: async (req, res) => {
    try {
      const { page = 1, limit = 10, unreadOnly = false } = req.query;
      const userId = req.user.id;
      
      // Build query
      const query = { userId };
      if (unreadOnly === 'true' || unreadOnly === true) {
        query.read = false;
      }
      
      // Get paginated notifications
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const notifications = await NotificationMock.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const totalNotifications = await NotificationMock.countDocuments(query);
      
      return res.json({
        status: 'success',
        data: {
          notifications,
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalNotifications / parseInt(limit)),
          totalNotifications
        }
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred retrieving notifications'
      });
    }
  },
  
  // Get notification by ID
  getNotification: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Find notification
      const notification = await NotificationMock.findOne({
        _id: id,
        userId
      });
      
      if (!notification) {
        return res.status(404).json({
          status: 'fail',
          message: 'Notification not found'
        });
      }
      
      // Mark as read if not already
      if (!notification.read) {
        notification.read = true;
        await NotificationMock.findByIdAndUpdate(id, { read: true });
      }
      
      return res.json({
        status: 'success',
        data: {
          notification
        }
      });
    } catch (error) {
      console.error('Get notification error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred retrieving notification'
      });
    }
  },
  
  // Mark notification as read
  markAsRead: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Find and update notification
      const notification = await NotificationMock.findOneAndUpdate(
        { _id: id, userId },
        { read: true },
        { new: true }
      );
      
      if (!notification) {
        return res.status(404).json({
          status: 'fail',
          message: 'Notification not found'
        });
      }
      
      return res.json({
        status: 'success',
        data: {
          notification
        }
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred marking notification as read'
      });
    }
  },
  
  // Mark all notifications as read
  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Update all user notifications
      await NotificationMock.updateMany(
        { userId, read: false },
        { read: true }
      );
      
      return res.json({
        status: 'success',
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Mark all as read error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred marking all notifications as read'
      });
    }
  },
  
  // Create a notification
  createNotification: async (req, res) => {
    try {
      const { userId, title, message, type, data } = req.body;
      
      // Validate required fields
      if (!userId || !title || !message) {
        return res.status(400).json({
          status: 'fail',
          message: 'User ID, title, and message are required'
        });
      }
      
      // Verify user exists
      const user = await UserMock.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: 'fail',
          message: 'User not found'
        });
      }
      
      // Create notification
      const notification = await NotificationMock.create({
        userId,
        title,
        message,
        type: type || 'info',
        data: data || {},
        read: false,
        createdAt: new Date()
      });
      
      return res.status(201).json({
        status: 'success',
        data: {
          notification
        }
      });
    } catch (error) {
      console.error('Create notification error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred creating notification'
      });
    }
  },
  
  // Delete a notification
  deleteNotification: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Find and delete notification
      const notification = await NotificationMock.findOneAndDelete({
        _id: id,
        userId
      });
      
      if (!notification) {
        return res.status(404).json({
          status: 'fail',
          message: 'Notification not found'
        });
      }
      
      return res.json({
        status: 'success',
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Delete notification error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred deleting notification'
      });
    }
  },
  
  // Get unread notification count
  getUnreadCount: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Count unread notifications
      const count = await NotificationMock.countDocuments({
        userId,
        read: false
      });
      
      return res.json({
        status: 'success',
        data: {
          count
        }
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred retrieving unread notification count'
      });
    }
  }
};

describe('Notification Controller Tests', function() {
  // Setup hooks
  before(async function() {
    // Connect to test database if not already connected
    if (mongoose.connection.readyState !== 1) {
      await dbHelper.connect();
    }
  });

  after(async function() {
    // No need to disconnect here as the global after hook will handle it
  });

  // Define mock data
  let mockNotifications, mockUser, mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Create mock data
    mockUser = {
      _id: new ObjectId(),
      name: 'Test User',
      email: 'test@example.com'
    };
    
    mockNotifications = [
      {
        _id: new ObjectId(),
        userId: mockUser._id,
        title: 'Test Notification 1',
        message: 'This is a test notification 1',
        type: 'info',
        data: {},
        read: false,
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        userId: mockUser._id,
        title: 'Test Notification 2',
        message: 'This is a test notification 2',
        type: 'alert',
        data: { orderId: '12345' },
        read: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ];

    // Setup request object
    mockReq = {
      user: { id: mockUser._id.toString() },
      body: {
        userId: mockUser._id.toString(),
        title: 'New Notification',
        message: 'This is a new notification',
        type: 'success',
        data: { bookingId: '67890' }
      },
      params: { id: mockNotifications[0]._id.toString() },
      query: { page: 1, limit: 10, unreadOnly: false }
    };
    
    // Setup response object
    mockRes = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    
    // Setup next function
    mockNext = sinon.stub();
    
    // Reset all stubs
    sinon.restore();

    // Setup mock behaviors
    NotificationMock.find = sinon.stub().returns({
      sort: sinon.stub().returnsThis(),
      skip: sinon.stub().returnsThis(),
      limit: sinon.stub().resolves(mockNotifications)
    });
    
    NotificationMock.findById = sinon.stub().resolves(mockNotifications[0]);
    NotificationMock.findOne = sinon.stub().resolves(mockNotifications[0]);
    NotificationMock.findByIdAndUpdate = sinon.stub().resolves(mockNotifications[0]);
    NotificationMock.findOneAndUpdate = sinon.stub().resolves({
      ...mockNotifications[0],
      read: true
    });
    NotificationMock.findOneAndDelete = sinon.stub().resolves(mockNotifications[0]);
    NotificationMock.create = sinon.stub().resolves(mockNotifications[0]);
    NotificationMock.countDocuments = sinon.stub().resolves(2);
    NotificationMock.updateMany = sinon.stub().resolves({ nModified: 1 });
    
    UserMock.findById = sinon.stub().resolves(mockUser);
    
    ErrorLogMock.create = sinon.stub().resolves({});
  });

  afterEach(() => {
    // Clean up after each test
    sinon.restore();
  });

  // Test the controller's existence and functions
  describe('Controller Initialization', () => {
    it('should exist and export expected functions', () => {
      expect(notificationController).to.be.an('object');
      expect(notificationController.getUserNotifications).to.be.a('function');
      expect(notificationController.getNotification).to.be.a('function');
      expect(notificationController.markAsRead).to.be.a('function');
      expect(notificationController.markAllAsRead).to.be.a('function');
      expect(notificationController.createNotification).to.be.a('function');
      expect(notificationController.deleteNotification).to.be.a('function');
      expect(notificationController.getUnreadCount).to.be.a('function');
    });
  });

  // Test getUserNotifications
  describe('getUserNotifications Function', () => {
    it('should retrieve user notifications with pagination', async () => {
      // Call the controller function
      await notificationController.getUserNotifications(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('notifications');
      expect(response.data).to.have.property('currentPage');
      expect(response.data).to.have.property('totalPages');
      expect(response.data).to.have.property('totalNotifications');
      
      // Verify database operations
      expect(NotificationMock.find.calledOnce).to.be.true;
      expect(NotificationMock.countDocuments.calledOnce).to.be.true;
    });

    it('should filter by unread notifications when unreadOnly is true', async () => {
      // Setup request with unreadOnly filter
      mockReq.query.unreadOnly = true;
      
      // Call the controller function
      await notificationController.getUserNotifications(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Verify database operations with correct query
      expect(NotificationMock.find.calledOnce).to.be.true;
      expect(NotificationMock.countDocuments.calledOnce).to.be.true;
    });
  });

  // Test getNotification
  describe('getNotification Function', () => {
    it('should retrieve notification by ID and mark as read', async () => {
      // Call the controller function
      await notificationController.getNotification(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('notification');
      
      // Verify database operations
      expect(NotificationMock.findOne.calledOnce).to.be.true;
      expect(NotificationMock.findByIdAndUpdate.calledOnce).to.be.true;
    });

    it('should return 404 if notification not found', async () => {
      // Make findOne return null
      NotificationMock.findOne = sinon.stub().resolves(null);
      
      // Call the controller function
      await notificationController.getNotification(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(404)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('not found');
    });

    it('should not update already read notifications', async () => {
      // Make the notification already read
      NotificationMock.findOne = sinon.stub().resolves({
        ...mockNotifications[0],
        read: true
      });
      
      // Call the controller function
      await notificationController.getNotification(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Verify database operations - should not update
      expect(NotificationMock.findOne.calledOnce).to.be.true;
      expect(NotificationMock.findByIdAndUpdate.called).to.be.false;
    });
  });

  // Test markAsRead
  describe('markAsRead Function', () => {
    it('should mark notification as read', async () => {
      // Call the controller function
      await notificationController.markAsRead(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('notification');
      expect(response.data.notification.read).to.be.true;
      
      // Verify database operations
      expect(NotificationMock.findOneAndUpdate.calledOnce).to.be.true;
    });

    it('should return 404 if notification not found', async () => {
      // Make findOneAndUpdate return null
      NotificationMock.findOneAndUpdate = sinon.stub().resolves(null);
      
      // Call the controller function
      await notificationController.markAsRead(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(404)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('not found');
    });
  });

  // Test markAllAsRead
  describe('markAllAsRead Function', () => {
    it('should mark all notifications as read', async () => {
      // Call the controller function
      await notificationController.markAllAsRead(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.message).to.include('All notifications marked as read');
      
      // Verify database operations
      expect(NotificationMock.updateMany.calledOnce).to.be.true;
    });
  });

  // Test createNotification
  describe('createNotification Function', () => {
    it('should create a notification successfully', async () => {
      // Call the controller function
      await notificationController.createNotification(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(201)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('notification');
      
      // Verify database operations
      expect(UserMock.findById.calledOnce).to.be.true;
      expect(NotificationMock.create.calledOnce).to.be.true;
    });

    it('should return 400 if required fields are missing', async () => {
      // Setup request with missing fields
      mockReq.body = {};
      
      // Call the controller function
      await notificationController.createNotification(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(400)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('required');
    });

    it('should return 404 if user not found', async () => {
      // Make findById return null
      UserMock.findById = sinon.stub().resolves(null);
      
      // Call the controller function
      await notificationController.createNotification(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(404)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('User not found');
    });
  });

  // Test deleteNotification
  describe('deleteNotification Function', () => {
    it('should delete a notification successfully', async () => {
      // Call the controller function
      await notificationController.deleteNotification(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.message).to.include('deleted successfully');
      
      // Verify database operations
      expect(NotificationMock.findOneAndDelete.calledOnce).to.be.true;
    });

    it('should return 404 if notification not found', async () => {
      // Make findOneAndDelete return null
      NotificationMock.findOneAndDelete = sinon.stub().resolves(null);
      
      // Call the controller function
      await notificationController.deleteNotification(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(404)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('not found');
    });
  });

  // Test getUnreadCount
  describe('getUnreadCount Function', () => {
    it('should get unread notification count', async () => {
      // Set up countDocuments to return a specific number
      NotificationMock.countDocuments = sinon.stub().resolves(5);
      
      // Call the controller function
      await notificationController.getUnreadCount(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('count', 5);
      
      // Verify database operations
      expect(NotificationMock.countDocuments.calledOnce).to.be.true;
    });
  });
}); 