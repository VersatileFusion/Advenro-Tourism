const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Flight = require('../models/Flight');
const Restaurant = require('../models/Restaurant');
const Event = require('../models/Event');
const LocalService = require('../models/LocalService');
const upload = require('../middleware/upload');

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

/**
 * @swagger
 * /admin/users/{id}/bookings:
 *   get:
 *     summary: Get user bookings
 *     tags: [Admin]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User bookings retrieved successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
router.get('/users/:id/bookings', authenticate, authorize('admin'), adminController.getUserBookings);

/**
 * @swagger
 * /admin/restaurants:
 *   get:
 *     summary: Get all restaurants with filtering options
 *     tags: [Admin, Restaurants]
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
 *         name: cuisineType
 *         schema:
 *           type: string
 *       - in: query
 *         name: priceLevel
 *         schema:
 *           type: string
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of restaurants retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get('/restaurants', authenticate, authorize('admin'), adminController.getAdminRestaurants);

/**
 * @swagger
 * /admin/restaurants/{id}:
 *   get:
 *     summary: Get restaurant details
 *     tags: [Admin, Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Restaurant details retrieved successfully
 *       404:
 *         description: Restaurant not found
 *       401:
 *         description: Not authorized
 */
router.get('/restaurants/:id', authenticate, authorize('admin'), adminController.getAdminRestaurantById);

/**
 * @swagger
 * /admin/restaurants:
 *   post:
 *     summary: Create a new restaurant
 *     tags: [Admin, Restaurants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - cuisineType
 *               - priceLevel
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               cuisineType:
 *                 type: array
 *                 items:
 *                   type: string
 *               priceLevel:
 *                 type: number
 *               coverImage:
 *                 type: string
 *                 format: binary
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Restaurant created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/restaurants', authenticate, authorize('admin'), upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'images', maxCount: 5 }
]), adminController.createRestaurant);

/**
 * @swagger
 * /admin/restaurants/{id}:
 *   put:
 *     summary: Update restaurant details
 *     tags: [Admin, Restaurants]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               cuisineType:
 *                 type: array
 *                 items:
 *                   type: string
 *               priceLevel:
 *                 type: number
 *               coverImage:
 *                 type: string
 *                 format: binary
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Restaurant updated successfully
 *       404:
 *         description: Restaurant not found
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.put('/restaurants/:id', authenticate, authorize('admin'), upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'images', maxCount: 5 }
]), adminController.updateRestaurant);

/**
 * @swagger
 * /admin/restaurants/{id}:
 *   delete:
 *     summary: Delete a restaurant (soft delete)
 *     tags: [Admin, Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Restaurant deleted successfully
 *       404:
 *         description: Restaurant not found
 *       401:
 *         description: Not authorized
 */
router.delete('/restaurants/:id', authenticate, authorize('admin'), adminController.deleteRestaurant);

/**
 * @swagger
 * /admin/restaurants/{id}/toggle-status:
 *   patch:
 *     summary: Toggle restaurant active status
 *     tags: [Admin, Restaurants]
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
 *             properties:
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Restaurant status updated successfully
 *       404:
 *         description: Restaurant not found
 *       401:
 *         description: Not authorized
 */
router.patch('/restaurants/:id/toggle-status', authenticate, authorize('admin'), adminController.toggleRestaurantStatus);

/**
 * @swagger
 * /admin/events:
 *   get:
 *     summary: Get all events with filtering options
 *     tags: [Admin, Events]
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
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get('/events', authenticate, authorize('admin'), adminController.getEvents);

/**
 * @swagger
 * /admin/events/stats:
 *   get:
 *     summary: Get event statistics
 *     tags: [Admin, Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Event statistics retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get('/events/stats', authenticate, authorize('admin'), adminController.getEventStats);

/**
 * @swagger
 * /admin/events/{id}/status:
 *   put:
 *     summary: Update event status
 *     tags: [Admin, Events]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [upcoming, ongoing, completed, canceled]
 *     responses:
 *       200:
 *         description: Event status updated successfully
 *       404:
 *         description: Event not found
 */
router.put('/events/:id/status', authenticate, authorize('admin'), adminController.updateEventStatus);

/**
 * @swagger
 * /admin/services:
 *   get:
 *     summary: Get all local services with filtering options
 *     tags: [Admin, LocalServices]
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
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *       - in: query
 *         name: priceRange
 *         schema:
 *           type: string
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Local services retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get('/services', authenticate, authorize('admin'), adminController.getLocalServices);

/**
 * @swagger
 * /admin/services/stats:
 *   get:
 *     summary: Get local service statistics
 *     tags: [Admin, LocalServices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Local service statistics retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get('/services/stats', authenticate, authorize('admin'), adminController.getServiceStats);

/**
 * @swagger
 * /admin/services/{id}/verify:
 *   put:
 *     summary: Verify or unverify a local service
 *     tags: [Admin, LocalServices]
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
 *               - isVerified
 *             properties:
 *               isVerified:
 *                 type: boolean
 *               verificationNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Local service verification status updated successfully
 *       404:
 *         description: Local service not found
 */
router.put('/services/:id/verify', authenticate, authorize('admin'), adminController.verifyLocalService);

/**
 * @swagger
 * /admin/bookings/stats:
 *   get:
 *     summary: Get booking statistics and analytics
 *     tags: [Admin, Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year, all]
 *     responses:
 *       200:
 *         description: Booking statistics retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get('/bookings/stats', authenticate, authorize('admin'), adminController.getBookingStats);

/**
 * @swagger
 * /admin/users/profiles:
 *   get:
 *     summary: Get all user profiles with filtering options
 *     tags: [Admin, Users]
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
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profiles retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get('/users/profiles', authenticate, authorize('admin'), adminController.getUserProfiles);

/**
 * @swagger
 * /admin/users/{id}/profile:
 *   get:
 *     summary: Get detailed user profile with activities
 *     tags: [Admin, Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile details retrieved successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
router.get('/users/:id/profile', authenticate, authorize('admin'), adminController.getUserProfileDetails);

/**
 * @swagger
 * /admin/users/{id}/status:
 *   put:
 *     summary: Update user status
 *     tags: [Admin, Users]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended, pending]
 *               statusNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       404:
 *         description: User not found
 */
router.put('/users/:id/status', authenticate, authorize('admin'), adminController.updateUserStatus);

// Add this new route for admin stats
router.get('/stats', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Get counts from different collections
    const stats = {
      users: await User.countDocuments(),
      hotels: await Hotel.countDocuments(),
      flights: await Flight.countDocuments(),
      restaurants: await Restaurant.countDocuments(),
      events: await Event.countDocuments(),
      localServices: await LocalService.countDocuments()
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error fetching admin statistics' });
  }
});

module.exports = router; 