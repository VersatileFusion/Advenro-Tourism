const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get('/dashboard', authenticate, authorize('admin'), adminController.getDashboardStats);

/**
 * @swagger
 * /admin/activity:
 *   get:
 *     summary: Get user activity logs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User activity logs retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get('/activity', authenticate, authorize('admin'), adminController.getUserActivity);

/**
 * @swagger
 * /admin/performance:
 *   get:
 *     summary: Get system performance metrics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System metrics retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get('/performance', authenticate, authorize('admin'), adminController.getSystemMetrics);

/**
 * @swagger
 * /admin/content:
 *   get:
 *     summary: Get content management statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Content statistics retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get('/content', authenticate, authorize('admin'), adminController.getContentStats);

/**
 * @swagger
 * /admin/users/{id}/role:
 *   put:
 *     summary: Update user role
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       404:
 *         description: User not found
 */
router.put('/users/:id/role', authenticate, authorize('admin'), adminController.updateUserRole);

/**
 * @swagger
 * /admin/users/{id}/ban:
 *   put:
 *     summary: Ban or unban a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isBanned
 *             properties:
 *               isBanned:
 *                 type: boolean
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User ban status updated successfully
 *       404:
 *         description: User not found
 */
router.put('/users/:id/ban', authenticate, authorize('admin'), adminController.toggleUserBan);

/**
 * @swagger
 * /admin/system/config:
 *   put:
 *     summary: Update system configuration
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: System configuration updated successfully
 */
router.put('/system/config', authenticate, authorize('admin'), adminController.updateSystemConfig);

/**
 * @swagger
 * /admin/notifications/bulk:
 *   post:
 *     summary: Send bulk notifications
 *     tags: [Admin]
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
 *               - type
 *               - userIds
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Notifications sent successfully
 */
router.post('/notifications/bulk', authenticate, authorize('admin'), adminController.sendBulkNotifications);

/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 */
router.get('/audit-logs', authenticate, authorize('admin'), adminController.getAuditLogs);

/**
 * @swagger
 * /admin/system/maintenance:
 *   put:
 *     summary: Toggle maintenance mode
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enabled
 *             properties:
 *               enabled:
 *                 type: boolean
 *               message:
 *                 type: string
 *               endTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Maintenance mode updated successfully
 */
router.put('/system/maintenance', authenticate, authorize('admin'), adminController.toggleMaintenanceMode);

/**
 * @swagger
 * /admin/backup:
 *   post:
 *     summary: Create system backup
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               collections:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Backup created successfully
 */
router.post('/backup', authenticate, authorize('admin'), adminController.createBackup);

/**
 * @swagger
 * /admin/backup/{filename}:
 *   post:
 *     summary: Restore system from backup
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: System restored successfully
 */
router.post('/backup/:filename', authenticate, authorize('admin'), adminController.restoreBackup);

/**
 * @swagger
 * /admin/backups:
 *   get:
 *     summary: Get list of available backups
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of backups retrieved successfully
 */
router.get('/backups', authenticate, authorize('admin'), adminController.getBackupsList);

module.exports = router; 