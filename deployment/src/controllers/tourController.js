const { Tour } = require('../models');

// @desc    Get all tours
// @route   GET /api/v1/tours
// @access  Public
exports.getTours = async (req, res) => {
    try {
        const {
            minPrice,
            maxPrice,
            difficulty,
            minDuration,
            maxDuration,
            rating,
            startDate,
            sort,
            page = 1,
            limit = 10,
            populate
        } = req.query;

        // Build query
        const query = {};
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = minPrice;
            if (maxPrice) query.price.$lte = maxPrice;
        }
        if (difficulty) query.difficulty = difficulty;
        if (minDuration || maxDuration) {
            query.duration = {};
            if (minDuration) query.duration.$gte = minDuration;
            if (maxDuration) query.duration.$lte = maxDuration;
        }
        if (rating) query.rating = { $gte: rating };
        if (startDate) query.startDates = { $gte: new Date(startDate) };

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Tour.countDocuments(query);

        // Build query with optional population
        let tourQuery = Tour.find(query)
            .skip(startIndex)
            .limit(limit);

        if (sort) {
            const sortBy = sort.split(',').join(' ');
            tourQuery = tourQuery.sort(sortBy);
        } else {
            tourQuery = tourQuery.sort('-createdAt');
        }

        if (populate === 'reviews') {
            tourQuery = tourQuery.populate('reviews');
        }

        const tours = await tourQuery;

        // Pagination result
        const pagination = {};
        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            };
        }
        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            };
        }

        res.json({
            success: true,
            count: tours.length,
            pagination,
            data: tours
        });
    } catch (error) {
        console.error('Get tours error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get single tour
// @route   GET /api/v1/tours/:id
// @access  Public
exports.getTour = async (req, res) => {
    try {
        const tour = await Tour.findById(req.params.id).populate('reviews');
        if (!tour) {
            return res.status(404).json({
                success: false,
                message: 'Tour not found'
            });
        }

        res.json({
            success: true,
            data: tour
        });
    } catch (error) {
        console.error('Get tour error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Create new tour
// @route   POST /api/v1/tours
// @access  Private/Admin
exports.createTour = async (req, res) => {
    try {
        const tour = await Tour.create(req.body);
        res.status(201).json({
            success: true,
            data: tour
        });
    } catch (error) {
        console.error('Create tour error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update tour
// @route   PUT /api/v1/tours/:id
// @access  Private/Admin
exports.updateTour = async (req, res) => {
    try {
        const tour = await Tour.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!tour) {
            return res.status(404).json({
                success: false,
                message: 'Tour not found'
            });
        }

        res.json({
            success: true,
            data: tour
        });
    } catch (error) {
        console.error('Update tour error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Delete tour
// @route   DELETE /api/v1/tours/:id
// @access  Private/Admin
exports.deleteTour = async (req, res) => {
    try {
        const tour = await Tour.findByIdAndDelete(req.params.id);
        if (!tour) {
            return res.status(404).json({
                success: false,
                message: 'Tour not found'
            });
        }

        res.json({
            success: true,
            message: 'Tour deleted successfully'
        });
    } catch (error) {
        console.error('Delete tour error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get tours within radius
// @route   GET /api/v1/tours/radius/:location/:distance
// @access  Public
exports.getToursWithinRadius = async (req, res) => {
    try {
        const { location, distance } = req.params;

        // Get lat/lng from location string
        const [lat, lng] = location.split(',');
        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Please provide latitude and longitude in the format lat,lng'
            });
        }

        // Calculate radius using radians
        // Divide distance by radius of Earth
        // Earth Radius = 6,378 km
        const radius = distance / 6378;

        const tours = await Tour.find({
            startLocation: {
                $geoWithin: {
                    $centerSphere: [[lng, lat], radius]
                }
            }
        });

        res.json({
            success: true,
            count: tours.length,
            data: tours
        });
    } catch (error) {
        console.error('Get tours within radius error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get tour statistics
// @route   GET /api/v1/tours/stats
// @access  Public
exports.getTourStats = async (req, res) => {
    try {
        const stats = await Tour.aggregate([
            {
                $match: { ratingsAverage: { $gte: 4.5 } }
            },
            {
                $group: {
                    _id: '$difficulty',
                    numTours: { $sum: 1 },
                    numRatings: { $sum: '$ratingsQuantity' },
                    avgRating: { $avg: '$ratingsAverage' },
                    avgPrice: { $avg: '$price' },
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            },
            {
                $sort: { avgPrice: 1 }
            }
        ]);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get tour stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
}; 