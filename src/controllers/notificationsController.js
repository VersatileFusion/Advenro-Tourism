const { Notification, User } = require("../models");

// Get all notifications for the authenticated user
exports.getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, read } = req.query;
    const userId = req.user.id;

    // Build query based on filters
    const query = { user: userId };

    if (read !== undefined) {
      query.read = read === "true";
    }

    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Count total documents
    const count = await Notification.countDocuments(query);

    // Count unread notifications
    const unreadCount = await Notification.countDocuments({
      user: userId,
      read: false,
    });

    res.json({
      success: true,
      data: {
        notifications,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalCount: count,
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the notification and update
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    // Update all unread notifications for the user
    const result = await Notification.updateMany(
      { user: userId, read: false },
      { read: true }
    );

    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get user notification preferences
exports.getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user with notification preferences
    const user = await User.findById(userId).select("notificationPreferences");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return preferences or default values
    const preferences = user.notificationPreferences || {
      email: true,
      push: true,
      sms: false,
      marketing: false,
      bookingUpdates: true,
      accountAlerts: true,
    };

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update notification preferences
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;

    // Update user preferences
    const user = await User.findByIdAndUpdate(
      userId,
      {
        notificationPreferences: {
          email: !!preferences.email,
          push: !!preferences.push,
          sms: !!preferences.sms,
          marketing: !!preferences.marketing,
          bookingUpdates: !!preferences.bookingUpdates,
          accountAlerts: !!preferences.accountAlerts,
        },
      },
      { new: true }
    ).select("notificationPreferences");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user.notificationPreferences,
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Subscribe to push notifications
exports.subscribeToPush = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscription } = req.body;

    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: "Subscription object is required",
      });
    }

    // Save push subscription to user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: {
          pushSubscriptions: subscription,
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Successfully subscribed to push notifications",
    });
  } catch (error) {
    console.error("Subscribe to push error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Unsubscribe from push notifications
exports.unsubscribeFromPush = async (req, res) => {
  try {
    const userId = req.user.id;
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: "Subscription endpoint is required",
      });
    }

    // Remove push subscription from user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          pushSubscriptions: { endpoint },
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Successfully unsubscribed from push notifications",
    });
  } catch (error) {
    console.error("Unsubscribe from push error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Send notification (admin only)
exports.sendNotification = async (req, res) => {
  try {
    const { title, message, users, type = "info" } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    let targetUsers = [];

    if (users && users.length > 0) {
      // Send to specific users
      targetUsers = await User.find({ _id: { $in: users } }).select("_id");
    } else {
      // Send to all users
      targetUsers = await User.find().select("_id");
    }

    // Create notifications for each user
    const notifications = targetUsers.map((user) => ({
      user: user._id,
      title,
      message,
      type,
      read: false,
    }));

    // Bulk insert notifications
    await Notification.insertMany(notifications);

    res.json({
      success: true,
      message: `Notification sent to ${targetUsers.length} users`,
    });
  } catch (error) {
    console.error("Send notification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
