const Tour = require('../models/Tour');

// @desc    Get all tours
// @route   GET /api/v1/tours
// @access  Public
exports.getTours = async (req, res) => {
    try {
        console.log('🔍 Fetching all tours with query:', req.query);
        
        // Build query
        let query = Tour.find();

        // Filter by price range
        if (req.query.minPrice || req.query.maxPrice) {
            query = query.where('price').gte(req.query.minPrice || 0);
            if (req.query.maxPrice) {
                query = query.where('price').lte(req.query.maxPrice);
            }
        }

        // Filter by difficulty
        if (req.query.difficulty) {
            console.log(`🎯 Filtering by difficulty: ${req.query.difficulty}`);
            query = query.where('difficulty').equals(req.query.difficulty);
        }

        // Filter by duration range
        if (req.query.minDuration || req.query.maxDuration) {
            query = query.where('duration').gte(req.query.minDuration || 1);
            if (req.query.maxDuration) {
                query = query.where('duration').lte(req.query.maxDuration);
            }
        }

        // Filter by rating
        if (req.query.rating) {
            console.log(`⭐ Filtering by minimum rating: ${req.query.rating}`);
            query = query.where('rating').gte(req.query.rating);
        }

        // Filter by start date range
        if (req.query.startDate) {
            console.log(`📅 Filtering by start date: ${req.query.startDate}`);
            const date = new Date(req.query.startDate);
            query = query.where('startDates').elemMatch({ $gte: date });
        }

        // Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        query = query.skip(startIndex).limit(limit);

        // Populate reviews if requested
        if (req.query.populate === 'reviews') {
            query = query.populate('reviews');
        }

        console.log('📊 Executing tour query...');
        const tours = await query;
        const total = await Tour.countDocuments();

        console.log(`✅ Found ${tours.length} tours`);
        res.status(200).json({
            success: true,
            count: tours.length,
            total,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            data: tours
        });
    } catch (error) {
        console.error('❌ Error fetching tours:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Get single tour
// @route   GET /api/v1/tours/:id
// @access  Public
exports.getTour = async (req, res) => {
    try {
        console.log(`🔍 Fetching tour with ID: ${req.params.id}`);
        const tour = await Tour.findById(req.params.id).populate('reviews');

        if (!tour) {
            console.log('❌ Tour not found');
            return res.status(404).json({
                success: false,
                error: 'Tour not found'
            });
        }

        console.log('✅ Tour found');
        res.status(200).json({
            success: true,
            data: tour
        });
    } catch (error) {
        console.error('❌ Error fetching tour:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Create new tour
// @route   POST /api/v1/tours
// @access  Private/Admin
exports.createTour = async (req, res) => {
    try {
        console.log('🎯 Creating new tour...');
        console.log('Request body:', req.body);

        const tour = await Tour.create(req.body);

        console.log(`✅ Tour created with ID: ${tour._id}`);
        res.status(201).json({
            success: true,
            data: tour
        });
    } catch (error) {
        console.error('❌ Error creating tour:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Tour with this name already exists'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Update tour
// @route   PUT /api/v1/tours/:id
// @access  Private/Admin
exports.updateTour = async (req, res) => {
    try {
        console.log(`🔄 Updating tour with ID: ${req.params.id}`);
        console.log('Update data:', req.body);

        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!tour) {
            console.log('❌ Tour not found');
            return res.status(404).json({
                success: false,
                error: 'Tour not found'
            });
        }

        console.log('✅ Tour updated successfully');
        res.status(200).json({
            success: true,
            data: tour
        });
    } catch (error) {
        console.error('❌ Error updating tour:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Delete tour
// @route   DELETE /api/v1/tours/:id
// @access  Private/Admin
exports.deleteTour = async (req, res) => {
    try {
        console.log(`🗑️ Deleting tour with ID: ${req.params.id}`);
        
        const tour = await Tour.findById(req.params.id);

        if (!tour) {
            console.log('❌ Tour not found');
            return res.status(404).json({
                success: false,
                error: 'Tour not found'
            });
        }

        await tour.deleteOne();
        console.log('✅ Tour deleted successfully');
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('❌ Error deleting tour:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Get tours within radius
// @route   GET /api/v1/tours/radius/:location/:distance
// @access  Public
exports.getToursWithinRadius = async (req, res) => {
    try {
        const { location, distance } = req.params;
        const [lat, lng] = location.split(',');

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                error: 'Please provide latitude and longitude in the format lat,lng'
            });
        }

        // Convert distance from km to radians
        const radius = distance / 6378.1;

        console.log(`🌍 Finding tours within ${distance}km of location (${lat}, ${lng})`);

        const tours = await Tour.find({
            'locations.coordinates': {
                $geoWithin: { $centerSphere: [[lng, lat], radius] }
            }
        });

        console.log(`✅ Found ${tours.length} tours within radius`);
        res.status(200).json({
            success: true,
            count: tours.length,
            data: tours
        });
    } catch (error) {
        console.error('❌ Error finding tours within radius:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Get tour statistics
// @route   GET /api/v1/tours/stats
// @access  Public
exports.getTourStats = async (req, res) => {
    try {
        console.log('📊 Calculating tour statistics...');
        
        const stats = await Tour.aggregate([
            {
                $match: { rating: { $gte: 0 } }
            },
            {
                $group: {
                    _id: '$difficulty',
                    numTours: { $sum: 1 },
                    avgRating: { $avg: '$rating' },
                    avgPrice: { $avg: '$price' },
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            },
            {
                $sort: { avgPrice: 1 }
            }
        ]);

        console.log('✅ Statistics calculated successfully');
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('❌ Error calculating tour statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
}; 