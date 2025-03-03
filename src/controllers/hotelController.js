const Hotel = require('../models/Hotel');

// @desc    Get all hotels
// @route   GET /api/v1/hotels
// @access  Public
exports.getHotels = async (req, res) => {
    try {
        console.log('🔍 Fetching all hotels with query:', req.query);
        
        // Build query
        let query = Hotel.find();

        // Filter by price range
        if (req.query.minPrice || req.query.maxPrice) {
            query = query.where('price').gte(req.query.minPrice || 0);
            if (req.query.maxPrice) {
                query = query.where('price').lte(req.query.maxPrice);
            }
        }

        // Filter by location
        if (req.query.city) {
            query = query.where('location.city').equals(req.query.city);
        }

        // Filter by rating
        if (req.query.rating) {
            query = query.where('rating').gte(req.query.rating);
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

        console.log('📊 Executing hotel query...');
        const hotels = await query;
        const total = await Hotel.countDocuments();

        console.log(`✅ Found ${hotels.length} hotels`);
        res.status(200).json({
            success: true,
            count: hotels.length,
            total,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            data: hotels
        });
    } catch (error) {
        console.error('❌ Error fetching hotels:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Get single hotel
// @route   GET /api/v1/hotels/:id
// @access  Public
exports.getHotel = async (req, res) => {
    try {
        console.log(`🔍 Fetching hotel with ID: ${req.params.id}`);
        const hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            console.log('❌ Hotel not found');
            return res.status(404).json({
                success: false,
                error: 'Hotel not found'
            });
        }

        console.log('✅ Hotel found');
        res.status(200).json({
            success: true,
            data: hotel
        });
    } catch (error) {
        console.error('❌ Error fetching hotel:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Create new hotel
// @route   POST /api/v1/hotels
// @access  Private/Admin
exports.createHotel = async (req, res) => {
    try {
        console.log('📝 Creating new hotel...');
        console.log('Request body:', req.body);

        const hotel = await Hotel.create(req.body);

        console.log(`✅ Hotel created with ID: ${hotel._id}`);
        res.status(201).json({
            success: true,
            data: hotel
        });
    } catch (error) {
        console.error('❌ Error creating hotel:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Hotel already exists'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Update hotel
// @route   PUT /api/v1/hotels/:id
// @access  Private/Admin
exports.updateHotel = async (req, res) => {
    try {
        console.log(`🔄 Updating hotel with ID: ${req.params.id}`);
        console.log('Update data:', req.body);

        const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!hotel) {
            console.log('❌ Hotel not found');
            return res.status(404).json({
                success: false,
                error: 'Hotel not found'
            });
        }

        console.log('✅ Hotel updated successfully');
        res.status(200).json({
            success: true,
            data: hotel
        });
    } catch (error) {
        console.error('❌ Error updating hotel:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Delete hotel
// @route   DELETE /api/v1/hotels/:id
// @access  Private/Admin
exports.deleteHotel = async (req, res) => {
    try {
        console.log(`🗑️ Deleting hotel with ID: ${req.params.id}`);
        
        const hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            console.log('❌ Hotel not found');
            return res.status(404).json({
                success: false,
                error: 'Hotel not found'
            });
        }

        await hotel.deleteOne();
        console.log('✅ Hotel deleted successfully');
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('❌ Error deleting hotel:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Get hotels within radius
// @route   GET /api/v1/hotels/radius/:zipcode/:distance
// @access  Public
exports.getHotelsInRadius = async (req, res) => {
    try {
        console.log(`🌍 Finding hotels within ${req.params.distance}km of ${req.params.zipcode}`);
        
        // Get lat/lng from geocoder
        const { zipcode, distance } = req.params;

        // Get center coordinates
        const loc = await geocoder.geocode(zipcode);
        const lat = loc[0].latitude;
        const lng = loc[0].longitude;

        // Calc radius using radians
        // Divide dist by radius of Earth
        // Earth Radius = 6,378 km
        const radius = distance / 6378;

        const hotels = await Hotel.find({
            'location.coordinates': {
                $geoWithin: { $centerSphere: [[lng, lat], radius] }
            }
        });

        console.log(`✅ Found ${hotels.length} hotels within ${distance}km`);
        res.status(200).json({
            success: true,
            count: hotels.length,
            data: hotels
        });
    } catch (error) {
        console.error('❌ Error finding hotels in radius:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
}; 