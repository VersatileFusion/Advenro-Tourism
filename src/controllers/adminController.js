const { User, Booking, Tour, Hotel, Flight, Review, AuditLog, SystemConfig, Notification, ErrorLog } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// @desc    Get dashboard statistics
// @route   GET /api/v1/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = catchAsync(async (req, res) => {
    // Get counts
    const userCount = await User.countDocuments();
    const bookingCount = await Booking.countDocuments();
    const tourCount = await Tour.countDocuments();
    const hotelCount = await Hotel.countDocuments();
    const flightCount = await Flight.countDocuments();
    const reviewCount = await Review.countDocuments();

    // Get recent bookings
    const recentBookings = await Booking.find()
        .sort('-createdAt')
        .limit(5)
        .populate('user', 'name email')
        .populate('tour', 'name')
        .populate('hotel', 'name')
        .populate('flight', 'flightNumber');

    // Get revenue statistics
    const revenue = await Booking.aggregate([
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$totalPrice' },
                averageRevenue: { $avg: '$totalPrice' },
                minRevenue: { $min: '$totalPrice' },
                maxRevenue: { $max: '$totalPrice' }
            }
        }
    ]);

    // Get monthly booking statistics
    const monthlyStats = await Booking.aggregate([
        {
            $group: {
                _id: { 
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                bookings: { $sum: 1 },
                revenue: { $sum: '$totalPrice' }
            }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
    ]);

    res.status(200).json({
        success: true,
        data: {
            counts: {
                users: userCount,
                bookings: bookingCount,
                tours: tourCount,
                hotels: hotelCount,
                flights: flightCount,
                reviews: reviewCount
            },
            recentBookings,
            revenue: revenue[0],
            monthlyStats
        }
    });
});

// @desc    Get user activity logs
// @route   GET /api/v1/admin/activity
// @access  Private/Admin
exports.getUserActivity = catchAsync(async (req, res) => {
    const activities = await User.aggregate([
        {
            $lookup: {
                from: 'bookings',
                localField: '_id',
                foreignField: 'user',
                as: 'bookings'
            }
        },
        {
            $lookup: {
                from: 'reviews',
                localField: '_id',
                foreignField: 'user',
                as: 'reviews'
            }
        },
        {
            $project: {
                name: 1,
                email: 1,
                bookingCount: { $size: '$bookings' },
                reviewCount: { $size: '$reviews' },
                lastActive: { $max: ['$lastLogin', '$updatedAt'] }
            }
        },
        { $sort: { lastActive: -1 } }
    ]);

    res.status(200).json({
        success: true,
        data: activities
    });
});

// @desc    Get system performance metrics
// @route   GET /api/v1/admin/performance
// @access  Private/Admin
exports.getSystemMetrics = catchAsync(async (req, res) => {
    // Get average response times
    const bookingMetrics = await Booking.aggregate([
        {
            $group: {
                _id: null,
                averageProcessingTime: { $avg: '$processingTime' },
                successRate: {
                    $avg: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                }
            }
        }
    ]);

    // Get error rates
    const errorLogs = await ErrorLog.aggregate([
        {
            $group: {
                _id: { 
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    type: '$type'
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.date': -1 } }
    ]);

    res.status(200).json({
        success: true,
        data: {
            bookingMetrics: bookingMetrics[0],
            errorLogs
        }
    });
});

// @desc    Get content management statistics
// @route   GET /api/v1/admin/content
// @access  Private/Admin
exports.getContentStats = catchAsync(async (req, res) => {
    // Get tour statistics
    const tourStats = await Tour.aggregate([
        {
            $group: {
                _id: '$difficulty',
                count: { $sum: 1 },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' }
            }
        }
    ]);

    // Get hotel statistics
    const hotelStats = await Hotel.aggregate([
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                avgRating: { $avg: '$rating' },
                avgPrice: { $avg: '$price' }
            }
        }
    ]);

    // Get review statistics
    const reviewStats = await Review.aggregate([
        {
            $group: {
                _id: '$rating',
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: -1 } }
    ]);

    res.status(200).json({
        success: true,
        data: {
            tourStats,
            hotelStats,
            reviewStats
        }
    });
});

// User Management
exports.updateUserRole = catchAsync(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, {
        role: req.body.role
    }, { new: true });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Log the action
    await AuditLog.create({
        user: req.user._id,
        action: 'CHANGE_ROLE',
        entityType: 'USER',
        entityId: user._id,
        description: `Changed user role to ${req.body.role}`,
        previousValue: user.role,
        newValue: req.body.role,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
    });

    res.status(200).json({
        success: true,
        data: user
    });
});

exports.toggleUserBan = catchAsync(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, {
        isBanned: req.body.isBanned,
        banReason: req.body.reason
    }, { new: true });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Log the action
    await AuditLog.create({
        user: req.user._id,
        action: req.body.isBanned ? 'BAN_USER' : 'UNBAN_USER',
        entityType: 'USER',
        entityId: user._id,
        description: req.body.isBanned 
            ? `Banned user for reason: ${req.body.reason}`
            : 'Unbanned user',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
    });

    // Send notification to user
    await Notification.create({
        title: req.body.isBanned ? 'Account Banned' : 'Account Unbanned',
        message: req.body.isBanned 
            ? `Your account has been banned. Reason: ${req.body.reason}`
            : 'Your account has been unbanned.',
        type: 'ACCOUNT',
        priority: 'HIGH',
        targetUsers: [user._id],
        sentBy: req.user._id
    });

    res.status(200).json({
        success: true,
        data: user
    });
});

// System Configuration
exports.updateSystemConfig = catchAsync(async (req, res) => {
    const config = await SystemConfig.findOneAndUpdate({}, {
        ...req.body,
        lastUpdatedBy: req.user._id
    }, { new: true, upsert: true });

    // Log the action
    await AuditLog.create({
        user: req.user._id,
        action: 'SYSTEM_CONFIG',
        entityType: 'SYSTEM',
        entityId: config._id,
        description: 'Updated system configuration',
        previousValue: config.toJSON(),
        newValue: req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
    });

    res.status(200).json({
        success: true,
        data: config
    });
});

// Notification Management
exports.sendBulkNotifications = catchAsync(async (req, res) => {
    const { title, message, type, userIds, scheduledFor, expiresAt } = req.body;

    const notification = await Notification.create({
        title,
        message,
        type,
        targetUsers: userIds,
        sentBy: req.user._id,
        scheduledFor,
        expiresAt,
        status: scheduledFor ? 'PENDING' : 'SENT'
    });

    // Log the action
    await AuditLog.create({
        user: req.user._id,
        action: 'BULK_NOTIFICATION',
        entityType: 'NOTIFICATION',
        entityId: notification._id,
        description: `Sent bulk notification to ${userIds.length} users`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
    });

    res.status(201).json({
        success: true,
        data: notification
    });
});

// Audit Logs
exports.getAuditLogs = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    let query = {};

    // Apply filters if provided
    if (req.query.action) query.action = req.query.action;
    if (req.query.entityType) query.entityType = req.query.entityType;
    if (req.query.userId) query.user = req.query.userId;
    if (req.query.startDate || req.query.endDate) {
        query.createdAt = {};
        if (req.query.startDate) query.createdAt.$gte = new Date(req.query.startDate);
        if (req.query.endDate) query.createdAt.$lte = new Date(req.query.endDate);
    }

    const logs = await AuditLog.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email');

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
        success: true,
        data: logs,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

// System Maintenance
exports.toggleMaintenanceMode = catchAsync(async (req, res) => {
    const config = await SystemConfig.findOneAndUpdate({}, {
        'maintenanceMode.enabled': req.body.enabled,
        'maintenanceMode.message': req.body.message,
        'maintenanceMode.startTime': req.body.enabled ? new Date() : null,
        'maintenanceMode.endTime': req.body.endTime,
        lastUpdatedBy: req.user._id
    }, { new: true, upsert: true });

    // Log the action
    await AuditLog.create({
        user: req.user._id,
        action: 'MAINTENANCE_MODE',
        entityType: 'SYSTEM',
        entityId: config._id,
        description: req.body.enabled 
            ? 'Enabled maintenance mode'
            : 'Disabled maintenance mode',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
    });

    // Send notification to all users
    if (req.body.enabled) {
        await Notification.create({
            title: 'System Maintenance',
            message: req.body.message || 'System is under maintenance.',
            type: 'MAINTENANCE',
            priority: 'HIGH',
            targetUsers: [], // Empty array means all users
            sentBy: req.user._id
        });
    }

    res.status(200).json({
        success: true,
        data: config
    });
});

// Backup Management
exports.createBackup = catchAsync(async (req, res) => {
    // Create backup of specified collections
    const collections = req.body.collections || ['users', 'tours', 'hotels', 'bookings', 'reviews'];
    const backup = {};

    for (const collection of collections) {
        const Model = mongoose.model(collection.charAt(0).toUpperCase() + collection.slice(1));
        backup[collection] = await Model.find({});
    }

    // Save backup to file system or cloud storage
    const backupFileName = `backup_${Date.now()}.json`;
    const backupPath = path.join(__dirname, '../backups', backupFileName);
    await fs.writeFile(backupPath, JSON.stringify(backup));

    // Log the backup action
    await AuditLog.create({
        user: req.user._id,
        action: 'BACKUP',
        entityType: 'SYSTEM',
        entityId: req.user._id,
        description: `Created system backup: ${collections.join(', ')}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
    });

    res.status(200).json({
        success: true,
        message: 'Backup created successfully',
        data: {
            filename: backupFileName,
            collections,
            timestamp: new Date()
        }
    });
});

exports.restoreBackup = catchAsync(async (req, res) => {
    const { backupFileName } = req.params;
    const backupPath = path.join(__dirname, '../backups', backupFileName);
    
    // Read and parse backup file
    const backupData = JSON.parse(await fs.readFile(backupPath));

    // Restore each collection
    for (const [collection, data] of Object.entries(backupData)) {
        const Model = mongoose.model(collection.charAt(0).toUpperCase() + collection.slice(1));
        await Model.deleteMany({}); // Clear existing data
        await Model.insertMany(data);
    }

    // Log the restore action
    await AuditLog.create({
        user: req.user._id,
        action: 'RESTORE',
        entityType: 'SYSTEM',
        entityId: req.user._id,
        description: `Restored system from backup: ${backupFileName}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
    });

    res.status(200).json({
        success: true,
        message: 'System restored successfully',
        data: {
            filename: backupFileName,
            collections: Object.keys(backupData),
            timestamp: new Date()
        }
    });
});

exports.getBackupsList = catchAsync(async (req, res) => {
    const backupsDir = path.join(__dirname, '../backups');
    const files = await fs.readdir(backupsDir);
    
    const backups = await Promise.all(files.map(async (file) => {
        const stats = await fs.stat(path.join(backupsDir, file));
        return {
            filename: file,
            size: stats.size,
            createdAt: stats.birthtime
        };
    }));

    res.status(200).json({
        success: true,
        data: backups
    });
}); 