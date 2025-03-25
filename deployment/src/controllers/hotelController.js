const { Hotel } = require('../models');

// @desc    Get all hotels
// @route   GET /api/v1/hotels
// @access  Public
exports.getHotels = async (req, res) => {
    try {
        const { minPrice, maxPrice, city, rating, page = 1, limit = 10 } = req.query;

        // Build query
        const query = {};
        if (minPrice) query.pricePerNight = { $gte: minPrice };
        if (maxPrice) query.pricePerNight = { ...query.pricePerNight, $lte: maxPrice };
        if (city) query.city = new RegExp(city, 'i');
        if (rating) query.rating = { $gte: rating };

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Hotel.countDocuments(query);

        const hotels = await Hotel.find(query)
            .skip(startIndex)
            .limit(limit);

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
            count: hotels.length,
            pagination,
            data: hotels
        });
    } catch (error) {
        console.error('Get hotels error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get single hotel
// @route   GET /api/v1/hotels/:id
// @access  Public
exports.getHotel = async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        res.json({
            success: true,
            data: hotel
        });
    } catch (error) {
        console.error('Get hotel error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Create new hotel
// @route   POST /api/v1/hotels
// @access  Private/Admin
exports.createHotel = async (req, res) => {
    try {
        const hotel = await Hotel.create(req.body);
        res.status(201).json({
            success: true,
            data: hotel
        });
    } catch (error) {
        console.error('Create hotel error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update hotel
// @route   PUT /api/v1/hotels/:id
// @access  Private/Admin
exports.updateHotel = async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        res.json({
            success: true,
            data: hotel
        });
    } catch (error) {
        console.error('Update hotel error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Delete hotel
// @route   DELETE /api/v1/hotels/:id
// @access  Private/Admin
exports.deleteHotel = async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndDelete(req.params.id);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        res.json({
            success: true,
            message: 'Hotel deleted successfully'
        });
    } catch (error) {
        console.error('Delete hotel error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get hotels within radius
// @route   GET /api/v1/hotels/radius/:zipcode/:distance
// @access  Public
exports.getHotelsInRadius = async (req, res) => {
    try {
        const { zipcode, distance } = req.params;

        // Get lat/lng from zipcode
        // You would need to implement geocoding here
        // For now, return a 501 Not Implemented
        res.status(501).json({
            success: false,
            message: 'Geocoding not implemented yet'
        });
    } catch (error) {
        console.error('Get hotels in radius error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
}; 