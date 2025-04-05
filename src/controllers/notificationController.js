/**
 * @file Notification Controller
 * @description Handles notification-related operations such as creating, retrieving, and managing user notifications
 */

const Notification = require('../models/Notification');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { validateObjectId } = require('../utils/validation');
const { ErrorResponse } = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

/**
 * @route GET /api/v1/notifications
 * @desc Get notifications for the current user
 * @access Private
 */
exports.getUserNotifications = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  
  // Build query
  const query = {
    recipient: req.user.id,
    isDeleted: false
  };
  
  // Filter by read status if provided
  if (req.query.read !== undefined) {
    query.read = req.query.read === 'true';
  }
  
  // Filter by type if provided
  if (req.query.type) {
    query.type = req.query.type;
  }
  
  // Execute query with pagination
  const total = await Notification.countDocuments(query);
  const notifications = await Notification.find(query)
    .sort('-createdAt')
    .skip(startIndex)
    .limit(limit)
    .lean();
  
  // Get unread count
  const unreadCount = await Notification.countDocuments({
    recipient: req.user.id,
    read: false,
    isDeleted: false
  });
  
  // Pagination result
  const pagination = {
    total,
    pages: Math.ceil(total / limit),
    page,
    limit,
    startIndex,
    unreadCount
  };
  
  res.status(200).json({
    success: true,
    count: notifications.length,
    unreadCount,
    pagination,
    data: notifications
  });
});

/**
 * @route POST /api/v1/notifications
 * @desc Create a notification (admin only)
 * @access Admin
 */
exports.createNotification = asyncHandler(async (req, res, next) => {
  const { recipient, type, title, message, link, data } = req.body;
  
  // Validate required fields
  if (!recipient || !type || !title || !message) {
    return next(new ErrorResponse('Please provide recipient, type, title, and message', 400));
  }
  
  // Validate recipient exists
  if (!validateObjectId(recipient)) {
    return next(new ErrorResponse('Invalid recipient ID', 400));
  }
  
  const user = await User.findById(recipient);
  if (!user) {
    return next(new ErrorResponse('Recipient user not found', 404));
  }
  
  // Create notification
  const notification = await Notification.create({
    recipient,
    type,
    title,
    message,
    link,
    data,
    createdBy: req.user.id
  });
  
  res.status(201).json({
    success: true,
    data: notification
  });
});

/**
 * @route POST /api/v1/notifications/broadcast
 * @desc Broadcast notification to multiple users or all users (admin only)
 * @access Admin
 */
exports.broadcastNotification = asyncHandler(async (req, res, next) => {
  const { recipients, excludeUsers, type, title, message, link, data } = req.body;
  
  // Validate required fields
  if (!type || !title || !message) {
    return next(new ErrorResponse('Please provide type, title, and message', 400));
  }
  
  // Build recipient query
  let recipientQuery = {};
  
  // If specific recipients provided, use them
  if (recipients && recipients.length > 0) {
    // Validate IDs
    const validIds = recipients.filter(id => validateObjectId(id));
    if (validIds.length === 0) {
      return next(new ErrorResponse('No valid recipient IDs provided', 400));
    }
    recipientQuery = { _id: { $in: validIds } };
  }
  
  // Exclude specified users
  if (excludeUsers && excludeUsers.length > 0) {
    const validExcludeIds = excludeUsers.filter(id => validateObjectId(id));
    if (validExcludeIds.length > 0) {
      recipientQuery._id = recipientQuery._id || {};
      recipientQuery._id.$nin = validExcludeIds;
    }
  }
  
  // Find eligible recipients
  const users = await User.find(recipientQuery).select('_id');
  
  if (users.length === 0) {
    return next(new ErrorResponse('No eligible recipients found', 404));
  }
  
  // Create notifications for all recipients
  const notifications = await Promise.all(
    users.map(user => 
      Notification.create({
        recipient: user._id,
        type,
        title,
        message,
        link,
        data,
        isBroadcast: true,
        createdBy: req.user.id
      })
    )
  );
  
  res.status(201).json({
    success: true,
    count: notifications.length,
    message: `Broadcast sent to ${notifications.length} users`
  });
});

/**
 * @route PATCH /api/v1/notifications/:id/read
 * @desc Mark a notification as read
 * @access Private
 */
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);
  
  if (!notification) {
    return next(new ErrorResponse('Notification not found', 404));
  }
  
  // Check if notification belongs to user
  if (notification.recipient.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to access this notification', 403));
  }
  
  // Update notification if not already read
  if (!notification.read) {
    notification.read = true;
    notification.readAt = Date.now();
    await notification.save();
  }
  
  res.status(200).json({
    success: true,
    data: notification
  });
});

/**
 * @route PATCH /api/v1/notifications/mark-all-read
 * @desc Mark all notifications as read for the current user
 * @access Private
 */
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { recipient: req.user.id, read: false, isDeleted: false },
    { read: true, readAt: Date.now() }
  );
  
  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

/**
 * @route DELETE /api/v1/notifications/:id
 * @desc Delete a notification
 * @access Private
 */
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);
  
  if (!notification) {
    return next(new ErrorResponse('Notification not found', 404));
  }
  
  // Check if notification belongs to user
  if (notification.recipient.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this notification', 403));
  }
  
  // Soft delete
  notification.isDeleted = true;
  await notification.save();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @route DELETE /api/v1/notifications
 * @desc Delete all notifications for the current user
 * @access Private
 */
exports.deleteAllNotifications = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { recipient: req.user.id, isDeleted: false },
    { isDeleted: true }
  );
  
  res.status(200).json({
    success: true,
    message: 'All notifications deleted'
  });
});

/**
 * @route GET /api/v1/admin/notifications
 * @desc Get all notifications (admin only)
 * @access Admin
 */
exports.getAllNotifications = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  
  // Build query
  const query = {};
  
  // Filter by recipient if provided
  if (req.query.recipient) {
    if (validateObjectId(req.query.recipient)) {
      query.recipient = req.query.recipient;
    }
  }
  
  // Filter by read status if provided
  if (req.query.read !== undefined) {
    query.read = req.query.read === 'true';
  }
  
  // Filter by type if provided
  if (req.query.type) {
    query.type = req.query.type;
  }
  
  // Filter by broadcast status if provided
  if (req.query.isBroadcast !== undefined) {
    query.isBroadcast = req.query.isBroadcast === 'true';
  }
  
  // Filter by deleted status (default to non-deleted)
  if (req.query.isDeleted !== undefined) {
    query.isDeleted = req.query.isDeleted === 'true';
  } else {
    query.isDeleted = false;
  }
  
  // Execute query with pagination
  const total = await Notification.countDocuments(query);
  const notifications = await Notification.find(query)
    .populate('recipient', 'username email')
    .populate('createdBy', 'username')
    .sort('-createdAt')
    .skip(startIndex)
    .limit(limit);
  
  // Pagination result
  const pagination = {
    total,
    pages: Math.ceil(total / limit),
    page,
    limit,
    startIndex
  };
  
  res.status(200).json({
    success: true,
    count: notifications.length,
    pagination,
    data: notifications
  });
});

/**
 * @route DELETE /api/v1/admin/notifications/:id
 * @desc Delete a notification (admin only)
 * @access Admin
 */
exports.adminDeleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);
  
  if (!notification) {
    return next(new ErrorResponse('Notification not found', 404));
  }
  
  // Soft delete
  notification.isDeleted = true;
  await notification.save();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Get notification statistics
 * @route   GET /api/v1/admin/notifications/stats
 * @access  Private/Admin
 */
exports.getNotificationStats = asyncHandler(async (req, res, next) => {
  // Get total count
  const total = await Notification.countDocuments({ isDeleted: false });
  
  // Get unread count
  const unread = await Notification.countDocuments({ read: false, isDeleted: false });
  
  // Get broadcast count
  const broadcast = await Notification.countDocuments({ isBroadcast: true, isDeleted: false });
  
  // Get deleted count
  const deleted = await Notification.countDocuments({ isDeleted: true });
  
  // Get count by type
  const typeStats = await Notification.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  // Format type stats
  const typeCount = {};
  typeStats.forEach(type => {
    typeCount[type._id] = type.count;
  });
  
  res.status(200).json({
    success: true,
    data: {
      total,
      unread,
      broadcast,
      deleted,
      byType: typeCount
    }
  });
}); 