const { User, Booking, Tour, Hotel, Flight, Review, AuditLog, SystemConfig, Notification, ErrorLog, Restaurant, Event, LocalService } = require('../models');
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
    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const dateRange = req.query.dateRange || 'last30';
    const activityType = req.query.type || 'all';
    
    // Build date filter based on dateRange parameter
    let dateFilter = {};
    const now = new Date();
    
    switch (dateRange) {
        case 'today':
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            dateFilter = { lastActive: { $gte: startOfToday } };
            break;
        case 'yesterday':
            const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            dateFilter = { lastActive: { $gte: startOfYesterday, $lt: endOfYesterday } };
            break;
        case 'last7':
            const last7Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            dateFilter = { lastActive: { $gte: last7Days } };
            break;
        case 'last30':
            const last30Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
            dateFilter = { lastActive: { $gte: last30Days } };
            break;
        case 'thisMonth':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = { lastActive: { $gte: startOfMonth } };
            break;
        case 'lastMonth':
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = { lastActive: { $gte: startOfLastMonth, $lt: endOfLastMonth } };
            break;
        // Custom range would be handled with specific dates in the query
    }
    
    // Build search filter
    let searchFilter = {};
    if (search) {
        searchFilter = {
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        };
    }
    
    // Build activity type filter
    let typeFilter = {};
    if (activityType !== 'all') {
        if (activityType === 'booking') {
            typeFilter = { bookingCount: { $gt: 0 } };
        } else if (activityType === 'review') {
            typeFilter = { reviewCount: { $gt: 0 } };
        } else if (activityType === 'login') {
            typeFilter = { lastLogin: { $exists: true } };
        }
    }
    
    // Combine all filters
    const filter = {
        ...dateFilter,
        ...searchFilter,
        ...typeFilter
    };
    
    // Execute query with aggregation
    const activities = await User.aggregate([
        { $match: filter },
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
                role: 1,
                createdAt: 1,
                lastLogin: 1,
                bookingCount: { $size: '$bookings' },
                reviewCount: { $size: '$reviews' },
                recentBookings: { $slice: ['$bookings', 3] },
                recentReviews: { $slice: ['$reviews', 3] },
                lastActive: { 
                    $max: [
                        '$lastLogin', 
                        '$updatedAt', 
                        { $ifNull: [{ $max: '$bookings.createdAt' }, '$createdAt'] },
                        { $ifNull: [{ $max: '$reviews.createdAt' }, '$createdAt'] }
                    ] 
                }
            }
        },
        { $sort: { lastActive: -1 } },
        { $skip: skip },
        { $limit: limit }
    ]);
    
    // Get total count for pagination
    const totalCount = await User.countDocuments(filter);
    
    res.status(200).json({
        success: true,
        count: activities.length,
        data: activities,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
            totalCount
        }
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

    // Get recent errors with more detail
    const recentErrors = await ErrorLog.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .select('type message endpoint statusCode createdAt stack');
    
    // Get server stats using os module
    const os = require('os');
    const serverUptime = Math.floor(os.uptime() / 86400); // Convert to days
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);
    
    // Get CPU load
    const cpuLoad = Math.round(os.loadavg()[0] * 100 / os.cpus().length);
    
    // Mock disk usage (would be replaced with actual disk space check in production)
    const diskUsage = Math.round(Math.random() * 30 + 50); // Random between 50-80%
    
    // Get API response times for the last 24 hours
    const timePoints = [];
    const responseTimesData = [];
    
    // Generate 24 hourly data points
    for (let i = 23; i >= 0; i--) {
        const date = new Date();
        date.setHours(date.getHours() - i);
        timePoints.push(date.toLocaleTimeString('en-US', { hour: '2-digit', hour12: false }));
        
        // Mock response time data between 20-300ms
        responseTimesData.push(Math.floor(Math.random() * 280 + 20));
    }
    
    // Generate request distribution data
    const requestDistribution = {
        labels: ['Hotels', 'Flights', 'Tours', 'Restaurants', 'Local Services'],
        data: [
            Math.floor(Math.random() * 1000 + 1000),
            Math.floor(Math.random() * 800 + 600),
            Math.floor(Math.random() * 500 + 300),
            Math.floor(Math.random() * 400 + 200),
            Math.floor(Math.random() * 300 + 100)
        ]
    };
    
    // Generate error rate data for the last 7 days
    const errorRateData = {
        labels: [],
        data: []
    };
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        errorRateData.labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        errorRateData.data.push(Math.random() * 3); // Error rate percentage between 0-3%
    }
    
    // Transaction success rate
    const transactionSuccess = {
        success: 97.8,
        failed: 2.2
    };

    res.status(200).json({
        success: true,
        data: {
            bookingMetrics: bookingMetrics[0] || { averageProcessingTime: 0, successRate: 0 },
            errorLogs,
            serverHealth: {
                uptime: serverUptime,
                cpuUsage: cpuLoad,
                memoryUsage,
                diskUsage
            },
            responseTimes: {
                timePoints,
                data: responseTimesData
            },
            requestDistribution,
            errorRates: errorRateData,
            transactionSuccess,
            recentErrors
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

// @desc    Get bookings for specific user (Admin)
// @route   GET /api/v1/admin/users/:id/bookings
// @access  Private/Admin
exports.getUserBookings = catchAsync(async (req, res) => {
    const userId = req.params.id;
    
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return next(new AppError('Invalid user ID', 400));
    }
    
    // Ensure user exists
    const user = await User.findById(userId);
    if (!user) {
        return next(new AppError('User not found', 404));
    }
    
    // Get bookings for the user
    const bookings = await Booking.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate({
            path: 'item',
            select: 'name title'
        });
    
    // Process bookings to include item name
    const processedBookings = bookings.map(booking => {
        const bookingObj = booking.toObject();
        bookingObj.itemName = booking.item ? (booking.item.name || booking.item.title) : 'Unknown';
        return bookingObj;
    });
    
    res.status(200).json({
        success: true,
        count: processedBookings.length,
        data: processedBookings
    });
});

// RESTAURANT MANAGEMENT

// @desc    Get all restaurants with filtering for admin
// @route   GET /api/v1/admin/restaurants
// @access  Private/Admin
exports.getAdminRestaurants = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    
    // Apply cuisine filter
    if (req.query.cuisineType) {
        filter.cuisineType = { $in: [req.query.cuisineType] };
    }
    
    // Apply price level filter
    if (req.query.priceLevel) {
        filter.priceLevel = parseInt(req.query.priceLevel);
    }
    
    // Apply rating filter
    if (req.query.rating) {
        filter.averageRating = { $gte: parseFloat(req.query.rating) };
    }
    
    // Apply search filter
    if (req.query.search) {
        filter.$or = [
            { name: { $regex: req.query.search, $options: 'i' } },
            { description: { $regex: req.query.search, $options: 'i' } },
            { 'address.city': { $regex: req.query.search, $options: 'i' } },
            { 'address.country': { $regex: req.query.search, $options: 'i' } }
        ];
    }
    
    // Execute query
    const restaurants = await Restaurant.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    
    // Get total count for pagination
    const total = await Restaurant.countDocuments(filter);
    
    res.status(200).json({
        success: true,
        data: restaurants,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    });
});

// @desc    Get restaurant details for admin
// @route   GET /api/v1/admin/restaurants/:id
// @access  Private/Admin
exports.getAdminRestaurantById = catchAsync(async (req, res, next) => {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
        return next(new AppError('Restaurant not found', 404));
    }
    
    res.status(200).json({
        success: true,
        data: restaurant
    });
});

// @desc    Create new restaurant
// @route   POST /api/v1/admin/restaurants
// @access  Private/Admin
exports.createRestaurant = catchAsync(async (req, res, next) => {
    // Process location data if provided
    if (req.body.latitude && req.body.longitude) {
        req.body.location = {
            type: 'Point',
            coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
        };
        
        // Remove the latitude/longitude from the body as they're now in location
        delete req.body.latitude;
        delete req.body.longitude;
    }
    
    // Process cuisineType - ensure it's an array
    if (typeof req.body.cuisineType === 'string') {
        req.body.cuisineType = [req.body.cuisineType];
    }
    
    // Handle file uploads
    if (req.files) {
        // Process cover image
        if (req.files.coverImage) {
            req.body.coverImage = req.files.coverImage[0].filename;
        }
        
        // Process additional images
        if (req.files.images) {
            req.body.images = req.files.images.map(file => file.filename);
        }
    }
    
    // Create the restaurant
    const restaurant = await Restaurant.create(req.body);
    
    res.status(201).json({
        success: true,
        data: restaurant
    });
});

// @desc    Update restaurant
// @route   PUT /api/v1/admin/restaurants/:id
// @access  Private/Admin
exports.updateRestaurant = catchAsync(async (req, res, next) => {
    let restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
        return next(new AppError('Restaurant not found', 404));
    }
    
    // Process location data if provided
    if (req.body.latitude && req.body.longitude) {
        req.body.location = {
            type: 'Point',
            coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
        };
        
        // Remove the latitude/longitude from the body as they're now in location
        delete req.body.latitude;
        delete req.body.longitude;
    }
    
    // Process cuisineType - ensure it's an array
    if (typeof req.body.cuisineType === 'string') {
        req.body.cuisineType = [req.body.cuisineType];
    }
    
    // Handle file uploads
    if (req.files) {
        // Process cover image
        if (req.files.coverImage) {
            // Delete previous cover image if exists
            if (restaurant.coverImage && restaurant.coverImage !== 'default-restaurant.jpg') {
                try {
                    const imagePath = path.join(__dirname, '..', '..', 'public', 'uploads', 'restaurants', restaurant.coverImage);
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                } catch (err) {
                    console.error('Error deleting previous cover image:', err);
                }
            }
            
            req.body.coverImage = req.files.coverImage[0].filename;
        }
        
        // Process additional images
        if (req.files.images) {
            // Store new images
            const newImages = req.files.images.map(file => file.filename);
            
            // Delete removed images
            if (restaurant.images && restaurant.images.length > 0) {
                try {
                    // Images that were previously in the database but not in the new submission
                    const imagesToDelete = restaurant.images.filter(img => !req.body.existingImages || !req.body.existingImages.includes(img));
                    
                    for (const img of imagesToDelete) {
                        const imagePath = path.join(__dirname, '..', '..', 'public', 'uploads', 'restaurants', img);
                        if (fs.existsSync(imagePath)) {
                            fs.unlinkSync(imagePath);
                        }
                    }
                } catch (err) {
                    console.error('Error deleting removed images:', err);
                }
            }
            
            // Combine existing images with new ones
            req.body.images = req.body.existingImages ? 
                [...req.body.existingImages, ...newImages] : newImages;
            
            // Remove existingImages from body as it's been processed
            delete req.body.existingImages;
        }
    }
    
    // Update restaurant
    restaurant = await Restaurant.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );
    
    res.status(200).json({
        success: true,
        data: restaurant
    });
});

// @desc    Delete restaurant (soft delete)
// @route   DELETE /api/v1/admin/restaurants/:id
// @access  Private/Admin
exports.deleteRestaurant = catchAsync(async (req, res, next) => {
    const restaurant = await Restaurant.findByIdAndUpdate(
        req.params.id,
        { active: false },
        { new: true }
    );
    
    if (!restaurant) {
        return next(new AppError('Restaurant not found', 404));
    }
    
    res.status(200).json({
        success: true,
        data: null,
        message: 'Restaurant deleted successfully'
    });
});

// @desc    Toggle restaurant active status
// @route   PATCH /api/v1/admin/restaurants/:id/toggle-status
// @access  Private/Admin
exports.toggleRestaurantStatus = catchAsync(async (req, res, next) => {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
        return next(new AppError('Restaurant not found', 404));
    }
    
    restaurant.active = req.body.active !== undefined ? req.body.active : !restaurant.active;
    await restaurant.save();
    
    res.status(200).json({
        success: true,
        data: restaurant
    });
});

// EVENT MANAGEMENT API

// @desc    Get all events with filtering options
// @route   GET /api/v1/admin/events
// @access  Private/Admin
exports.getEvents = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.isFeatured) filter.isFeatured = req.query.isFeatured === 'true';
    
    // Date filtering
    if (req.query.startDate || req.query.endDate) {
        filter.date = {};
        if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
        if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }
    
    // Search filter
    if (req.query.search) {
        filter.$or = [
            { name: { $regex: req.query.search, $options: 'i' } },
            { description: { $regex: req.query.search, $options: 'i' } },
            { location: { $regex: req.query.search, $options: 'i' } }
        ];
    }
    
    // Fetch events with filter and pagination
    const events = await Event.find(filter)
        .skip(skip)
        .limit(limit)
        .sort(req.query.sort || 'date');
    
    const totalCount = await Event.countDocuments(filter);
    
    res.status(200).json({
        success: true,
        count: events.length,
        data: events,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
            totalCount
        }
    });
});

// @desc    Get event statistics
// @route   GET /api/v1/admin/events/stats
// @access  Private/Admin
exports.getEventStats = catchAsync(async (req, res) => {
    // Stats by category
    const categoryStats = await Event.aggregate([
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                avgTicketPrice: { $avg: '$ticketPrice' }
            }
        },
        { $sort: { count: -1 } }
    ]);
    
    // Stats by status
    const statusStats = await Event.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
    
    // Monthly event count
    const currentYear = new Date().getFullYear();
    const monthlyStats = await Event.aggregate([
        {
            $match: {
                date: {
                    $gte: new Date(`${currentYear}-01-01`),
                    $lte: new Date(`${currentYear}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { month: { $month: '$date' } },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.month': 1 } }
    ]);
    
    // Top 10 most booked events
    const topBooked = await Event.find()
        .sort('-bookingCount')
        .limit(10)
        .select('name date location category bookingCount');
    
    res.status(200).json({
        success: true,
        data: {
            categoryStats,
            statusStats,
            monthlyStats,
            topBooked
        }
    });
});

// @desc    Update event status
// @route   PUT /api/v1/admin/events/:id/status
// @access  Private/Admin
exports.updateEventStatus = catchAsync(async (req, res, next) => {
    const { status } = req.body;
    
    if (!['upcoming', 'ongoing', 'completed', 'canceled'].includes(status)) {
        return next(new AppError('Invalid status', 400));
    }
    
    const event = await Event.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
    );
    
    if (!event) {
        return next(new AppError('Event not found', 404));
    }
    
    // Log the action
    await AuditLog.create({
        user: req.user._id,
        action: 'UPDATE_EVENT_STATUS',
        entityType: 'EVENT',
        entityId: event._id,
        description: `Updated event status to ${status}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
    });
    
    res.status(200).json({
        success: true,
        data: event
    });
});

// LOCAL SERVICES MANAGEMENT API

// @desc    Get all local services with filtering options
// @route   GET /api/v1/admin/services
// @access  Private/Admin
exports.getLocalServices = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.rating) filter.averageRating = { $gte: parseFloat(req.query.rating) };
    if (req.query.priceRange) filter.priceRange = req.query.priceRange;
    if (req.query.isFeatured) filter.isFeatured = req.query.isFeatured === 'true';
    
    // Location filter
    if (req.query.city) filter['location.city'] = { $regex: req.query.city, $options: 'i' };
    
    // Search filter
    if (req.query.search) {
        filter.$or = [
            { name: { $regex: req.query.search, $options: 'i' } },
            { description: { $regex: req.query.search, $options: 'i' } }
        ];
    }
    
    // Fetch local services with filter and pagination
    const services = await LocalService.find(filter)
        .skip(skip)
        .limit(limit)
        .sort(req.query.sort || '-createdAt');
    
    const totalCount = await LocalService.countDocuments(filter);
    
    res.status(200).json({
        success: true,
        count: services.length,
        data: services,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
            totalCount
        }
    });
});

// @desc    Get local service statistics
// @route   GET /api/v1/admin/services/stats
// @access  Private/Admin
exports.getServiceStats = catchAsync(async (req, res) => {
    // Stats by category
    const categoryStats = await LocalService.aggregate([
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                avgRating: { $avg: '$averageRating' }
            }
        },
        { $sort: { count: -1 } }
    ]);
    
    // Stats by rating
    const ratingStats = await LocalService.aggregate([
        {
            $group: {
                _id: { $floor: '$averageRating' },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: -1 } }
    ]);
    
    // Stats by price range
    const priceStats = await LocalService.aggregate([
        {
            $group: {
                _id: '$priceRange',
                count: { $sum: 1 },
                avgRating: { $avg: '$averageRating' }
            }
        },
        { $sort: { _id: 1 } }
    ]);
    
    // Top cities by service count
    const cityStats = await LocalService.aggregate([
        {
            $group: {
                _id: '$location.city',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);
    
    res.status(200).json({
        success: true,
        data: {
            categoryStats,
            ratingStats,
            priceStats,
            cityStats
        }
    });
});

// @desc    Verify local service
// @route   PUT /api/v1/admin/services/:id/verify
// @access  Private/Admin
exports.verifyLocalService = catchAsync(async (req, res, next) => {
    const { isVerified, verificationNotes } = req.body;
    
    const service = await LocalService.findByIdAndUpdate(
        req.params.id,
        { 
            isVerified,
            verificationNotes,
            verifiedBy: req.user._id,
            verifiedAt: isVerified ? Date.now() : null
        },
        { new: true }
    );
    
    if (!service) {
        return next(new AppError('Local service not found', 404));
    }
    
    // Log the action
    await AuditLog.create({
        user: req.user._id,
        action: isVerified ? 'VERIFY_SERVICE' : 'UNVERIFY_SERVICE',
        entityType: 'LOCAL_SERVICE',
        entityId: service._id,
        description: isVerified 
            ? `Verified local service: ${service.name}`
            : `Unverified local service: ${service.name}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
    });
    
    res.status(200).json({
        success: true,
        data: service
    });
});

// BOOKING STATISTICS AND TOP DESTINATIONS

// @desc    Get booking statistics and analytics
// @route   GET /api/v1/admin/bookings/stats
// @access  Private/Admin
exports.getBookingStats = catchAsync(async (req, res) => {
    // Period filter (default to current year)
    const period = req.query.period || 'year';
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
        case 'week':
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            dateFilter = { 
                createdAt: { $gte: startOfWeek }
            };
            break;
        case 'month':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = { 
                createdAt: { $gte: startOfMonth }
            };
            break;
        case 'year':
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            dateFilter = { 
                createdAt: { $gte: startOfYear }
            };
            break;
        case 'all':
            // No date filter
            break;
    }
    
    // Booking counts by type
    const bookingByType = await Booking.aggregate([
        { $match: dateFilter },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 },
                totalRevenue: { $sum: '$totalPrice' }
            }
        }
    ]);
    
    // Monthly booking trends (for current year)
    const monthlyBookings = await Booking.aggregate([
        { 
            $match: { 
                createdAt: { $gte: new Date(now.getFullYear(), 0, 1) }
            }
        },
        {
            $group: {
                _id: { month: { $month: '$createdAt' } },
                count: { $sum: 1 },
                revenue: { $sum: '$totalPrice' }
            }
        },
        { $sort: { '_id.month': 1 } }
    ]);
    
    // Top 10 destinations by bookings
    const topDestinations = await Booking.aggregate([
        { $match: { type: 'hotel' } },
        {
            $lookup: {
                from: 'hotels',
                localField: 'hotel',
                foreignField: '_id',
                as: 'hotelDetails'
            }
        },
        { $unwind: '$hotelDetails' },
        {
            $group: {
                _id: '$hotelDetails.location.city',
                count: { $sum: 1 },
                revenue: { $sum: '$totalPrice' }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);
    
    // Booking status distribution
    const statusDistribution = await Booking.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
    
    // Average booking value over time (monthly)
    const avgBookingValue = await Booking.aggregate([
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                avgValue: { $avg: '$totalPrice' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
    ]);
    
    res.status(200).json({
        success: true,
        data: {
            bookingByType,
            monthlyBookings,
            topDestinations,
            statusDistribution,
            avgBookingValue
        }
    });
});

// USER PROFILE MANAGEMENT

// @desc    Get all user profiles with filtering
// @route   GET /api/v1/admin/users/profiles
// @access  Private/Admin
exports.getUserProfiles = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter
    let filter = {};
    
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
        filter.$or = [
            { name: { $regex: req.query.search, $options: 'i' } },
            { email: { $regex: req.query.search, $options: 'i' } }
        ];
    }
    
    // Date filtering for registration
    if (req.query.startDate || req.query.endDate) {
        filter.createdAt = {};
        if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
        if (req.query.endDate) filter.createdAt.$lte = new Date(req.query.endDate);
    }
    
    // Fetch users with filter and pagination
    const users = await User.find(filter)
        .select('name email role status createdAt lastLogin profileCompleteness bookingCount reviewCount')
        .skip(skip)
        .limit(limit)
        .sort(req.query.sort || '-createdAt');
    
    const totalCount = await User.countDocuments(filter);
    
    // Get user profile completeness statistics
    const profileStats = await User.aggregate([
        {
            $group: {
                _id: null,
                avgProfileCompleteness: { $avg: '$profileCompleteness' },
                completeProfiles: {
                    $sum: {
                        $cond: [{ $gte: ['$profileCompleteness', 80] }, 1, 0]
                    }
                },
                partialProfiles: {
                    $sum: {
                        $cond: [
                            { $and: [
                                { $gte: ['$profileCompleteness', 30] },
                                { $lt: ['$profileCompleteness', 80] }
                            ]},
                            1, 0
                        ]
                    }
                },
                minimalProfiles: {
                    $sum: {
                        $cond: [{ $lt: ['$profileCompleteness', 30] }, 1, 0]
                    }
                },
                totalUsers: { $sum: 1 }
            }
        }
    ]);
    
    res.status(200).json({
        success: true,
        count: users.length,
        data: users,
        profileStats: profileStats[0] || {},
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
            totalCount
        }
    });
});

// @desc    Get user profile details with activity
// @route   GET /api/v1/admin/users/:id/profile
// @access  Private/Admin
exports.getUserProfileDetails = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id)
        .select('-password');
    
    if (!user) {
        return next(new AppError('User not found', 404));
    }
    
    // Get user bookings
    const bookings = await Booking.find({ user: req.params.id })
        .sort('-createdAt')
        .limit(5)
        .populate('tour hotel flight');
    
    // Get user reviews
    const reviews = await Review.find({ user: req.params.id })
        .sort('-createdAt')
        .limit(5);
    
    // Get user's favorite items
    const favorites = await User.findById(req.params.id)
        .populate('favorites.tours favorites.hotels favorites.restaurants');
    
    // Get user's recent login activity
    const loginActivity = await AuditLog.find({
        user: req.params.id,
        action: 'LOGIN'
    })
    .sort('-createdAt')
    .limit(10)
    .select('createdAt ipAddress userAgent');
    
    res.status(200).json({
        success: true,
        data: {
            user,
            bookings,
            reviews,
            favorites: favorites ? favorites.favorites : {},
            loginActivity
        }
    });
});

// @desc    Update user profile status
// @route   PUT /api/v1/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = catchAsync(async (req, res, next) => {
    const { status, statusNote } = req.body;
    
    if (!['active', 'inactive', 'suspended', 'pending'].includes(status)) {
        return next(new AppError('Invalid status value', 400));
    }
    
    const user = await User.findByIdAndUpdate(
        req.params.id,
        { 
            status,
            statusNote,
            statusChangedAt: Date.now(),
            statusChangedBy: req.user._id
        },
        { new: true }
    ).select('-password');
    
    if (!user) {
        return next(new AppError('User not found', 404));
    }
    
    // Log the action
    await AuditLog.create({
        user: req.user._id,
        action: 'UPDATE_USER_STATUS',
        entityType: 'USER',
        entityId: user._id,
        description: `Updated user status to ${status}`,
        previousValue: user.status,
        newValue: status,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
    });
    
    // Send notification to user
    await Notification.create({
        title: 'Account Status Updated',
        message: `Your account status has been updated to ${status}${statusNote ? ': ' + statusNote : ''}`,
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