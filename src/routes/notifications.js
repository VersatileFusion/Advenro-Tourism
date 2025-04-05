/**
 * @file Notification Routes
 * @description Defines routes for notification management
 */

const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { authenticate } = require("../middleware/auth");
const { isAdmin } = require("../middleware/roleCheck");
const { authorize } = require("../middleware/auth");
const notificationsController = require("../controllers/notificationsController");

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *     responses:
 *       200:
 *         description: List of notifications
 *       401:
 *         description: Not authorized
 */
router.get("/", authenticate, notificationsController.getUserNotifications);

/**
 * @swagger
 * /notifications/{id}/read:
 *   post:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Notification not found
 */
router.post("/:id/read", authenticate, notificationsController.markAsRead);

/**
 * @swagger
 * /notifications/read-all:
 *   post:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Not authorized
 */
router.post("/read-all", authenticate, notificationsController.markAllAsRead);

/**
 * @swagger
 * /notifications/preferences:
 *   get:
 *     summary: Get user notification preferences
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences
 *       401:
 *         description: Not authorized
 */
router.get(
  "/preferences",
  authenticate,
  notificationsController.getPreferences
);

/**
 * @swagger
 * /notifications/preferences:
 *   put:
 *     summary: Update notification preferences
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: boolean
 *               push:
 *                 type: boolean
 *               sms:
 *                 type: boolean
 *               marketing:
 *                 type: boolean
 *               bookingUpdates:
 *                 type: boolean
 *               accountAlerts:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Preferences updated
 *       401:
 *         description: Not authorized
 */
router.put(
  "/preferences",
  authenticate,
  notificationsController.updatePreferences
);

/**
 * @swagger
 * /notifications/subscribe:
 *   post:
 *     summary: Subscribe to push notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscription
 *             properties:
 *               subscription:
 *                 type: object
 *                 description: Push subscription details from browser
 *     responses:
 *       200:
 *         description: Subscribed to push notifications
 *       401:
 *         description: Not authorized
 */
router.post(
  "/subscribe",
  authenticate,
  notificationsController.subscribeToPush
);

/**
 * @swagger
 * /notifications/unsubscribe:
 *   post:
 *     summary: Unsubscribe from push notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endpoint
 *             properties:
 *               endpoint:
 *                 type: string
 *                 description: Push subscription endpoint
 *     responses:
 *       200:
 *         description: Unsubscribed from push notifications
 *       401:
 *         description: Not authorized
 */
router.post(
  "/unsubscribe",
  authenticate,
  notificationsController.unsubscribeFromPush
);

/**
 * @swagger
 * /notifications/admin/send:
 *   post:
 *     summary: Send notification to users (admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               users:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of user IDs (send to all if empty)
 *               type:
 *                 type: string
 *                 enum: [info, warning, alert, promo]
 *     responses:
 *       200:
 *         description: Notification sent
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.post(
  "/admin/send",
  authenticate,
  authorize("admin"),
  notificationsController.sendNotification
);

// Admin routes

/**
 * @swagger
 * /api/v1/admin/notifications:
 *   get:
 *     summary: Get all notifications (Admin)
 *     description: Retrieve all notifications in the system (Admin only)
 *     tags: [Admin, Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: recipient
 *         schema:
 *           type: string
 *         description: Filter by recipient user ID
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by notification type
 *       - in: query
 *         name: isBroadcast
 *         schema:
 *           type: boolean
 *         description: Filter by broadcast status
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Unauthorized - User not authenticated
 *       403:
 *         description: Forbidden - User not authorized
 *       500:
 *         description: Server error
 */
router.get(
  "/admin/notifications",
  authenticate,
  isAdmin,
  notificationController.getAllNotifications
);

/**
 * @swagger
 * /api/v1/admin/notifications/stats:
 *   get:
 *     summary: Get notification statistics (Admin)
 *     description: Retrieve statistics about notifications in the system (Admin only)
 *     tags: [Admin, Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification statistics retrieved successfully
 *       401:
 *         description: Unauthorized - User not authenticated
 *       403:
 *         description: Forbidden - User not authorized
 *       500:
 *         description: Server error
 */
router.get(
  "/admin/notifications/stats",
  authenticate,
  isAdmin,
  notificationController.getNotificationStats
);

/**
 * @swagger
 * /api/v1/notifications:
 *   post:
 *     summary: Create notification (Admin)
 *     description: Create a new notification for a specific user (Admin only)
 *     tags: [Admin, Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipient
 *               - type
 *               - title
 *               - message
 *             properties:
 *               recipient:
 *                 type: string
 *                 description: User ID of the recipient
 *               type:
 *                 type: string
 *                 enum: [system, booking, payment, account, promotion, review, reminder, alert]
 *                 description: Type of notification
 *               title:
 *                 type: string
 *                 description: Notification title
 *               message:
 *                 type: string
 *                 description: Notification message
 *               link:
 *                 type: string
 *                 description: URL to redirect to when notification is clicked
 *               data:
 *                 type: object
 *                 description: Additional data related to the notification
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - User not authenticated
 *       403:
 *         description: Forbidden - User not authorized
 *       404:
 *         description: Recipient user not found
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  authenticate,
  isAdmin,
  notificationController.createNotification
);

/**
 * @swagger
 * /api/v1/notifications/broadcast:
 *   post:
 *     summary: Broadcast notification (Admin)
 *     description: Send a notification to multiple users or all users (Admin only)
 *     tags: [Admin, Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *               - message
 *             properties:
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of user IDs to send notification to (if empty, sent to all users)
 *               excludeUsers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of user IDs to exclude from the broadcast
 *               type:
 *                 type: string
 *                 enum: [system, booking, payment, account, promotion, review, reminder, alert]
 *                 description: Type of notification
 *               title:
 *                 type: string
 *                 description: Notification title
 *               message:
 *                 type: string
 *                 description: Notification message
 *               link:
 *                 type: string
 *                 description: URL to redirect to when notification is clicked
 *               data:
 *                 type: object
 *                 description: Additional data related to the notification
 *     responses:
 *       201:
 *         description: Notifications broadcast successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - User not authenticated
 *       403:
 *         description: Forbidden - User not authorized
 *       404:
 *         description: No eligible recipients found
 *       500:
 *         description: Server error
 */
router.post(
  "/broadcast",
  authenticate,
  isAdmin,
  notificationController.broadcastNotification
);

/**
 * @swagger
 * /api/v1/admin/notifications/{id}:
 *   delete:
 *     summary: Delete notification (Admin)
 *     description: Delete any notification in the system (Admin only)
 *     tags: [Admin, Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       401:
 *         description: Unauthorized - User not authenticated
 *       403:
 *         description: Forbidden - User not authorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/admin/notifications/:id",
  authenticate,
  isAdmin,
  notificationController.adminDeleteNotification
);

module.exports = router;
