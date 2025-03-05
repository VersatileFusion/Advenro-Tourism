const { Hotel } = require('../../models');
const { uploadToCloud } = require('../utils/cloudStorage');

// Get all hotels with pagination and filters
exports.getAllHotels = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sort = 'rating',
            order = 'desc',
            minPrice,
            maxPrice,
            amenities,
            rating
        } = req.query;

        const query = { isActive: true };

        // Apply filters
        if (minPrice || maxPrice) {
            query['rooms.price'] = {};
            if (minPrice) query['rooms.price'].$gte = Number(minPrice);
            if (maxPrice) query['rooms.price'].$lte = Number(maxPrice);
        }

        if (amenities) {
            query.amenities = { $in: amenities.split(',') };
        }

        if (rating) {
            query.rating = { $gte: Number(rating) };
        }

        // Execute query with pagination and sorting
        const hotels = await Hotel.find(query)
            .sort({ [sort]: order === 'desc' ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .populate('owner', 'firstName lastName email');

        const total = await Hotel.countDocuments(query);

        res.json({
            success: true,
            data: hotels,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching hotels',
            error: error.message
        });
    }
};

// Search hotels
exports.searchHotels = async (req, res) => {
    try {
        const {
            query,
            location,
            checkIn,
            checkOut,
            guests,
            page = 1,
            limit = 10
        } = req.query;

        const searchQuery = { isActive: true };

        // Text search
        if (query) {
            searchQuery.$text = { $search: query };
        }

        // Location search
        if (location) {
            const [lat, lng] = location.split(',').map(Number);
            searchQuery.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    $maxDistance: 50000 // 50km radius
                }
            };
        }

        // Availability search
        if (checkIn && checkOut) {
            searchQuery['rooms.bookings'] = {
                $not: {
                    $elemMatch: {
                        checkIn: { $lte: new Date(checkOut) },
                        checkOut: { $gte: new Date(checkIn) },
                        status: { $ne: 'cancelled' }
                    }
                }
            };
        }

        // Guest capacity search
        if (guests) {
            searchQuery['rooms.capacity'] = { $gte: Number(guests) };
        }

        const hotels = await Hotel.find(searchQuery)
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .populate('owner', 'firstName lastName email');

        const total = await Hotel.countDocuments(searchQuery);

        res.json({
            success: true,
            data: hotels,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching hotels',
            error: error.message
        });
    }
};

// Get hotel by ID
exports.getHotelById = async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id)
            .populate('owner', 'firstName lastName email')
            .populate('reviews');

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
        res.status(500).json({
            success: false,
            message: 'Error fetching hotel',
            error: error.message
        });
    }
};

// Create new hotel
exports.createHotel = async (req, res) => {
    try {
        const hotelData = req.body;
        hotelData.owner = req.user.userId;

        // Upload images to cloud storage
        if (req.files && req.files.length > 0) {
            hotelData.images = await Promise.all(
                req.files.map(file => uploadToCloud(file))
            );
        }

        const hotel = new Hotel(hotelData);
        await hotel.save();

        res.status(201).json({
            success: true,
            data: hotel
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating hotel',
            error: error.message
        });
    }
};

// Update hotel
exports.updateHotel = async (req, res) => {
    try {
        const hotel = await Hotel.findOne({
            _id: req.params.id,
            owner: req.user.userId
        });

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found or unauthorized'
            });
        }

        const updateData = req.body;

        // Upload new images if provided
        if (req.files && req.files.length > 0) {
            const newImages = await Promise.all(
                req.files.map(file => uploadToCloud(file))
            );
            updateData.images = [...hotel.images, ...newImages];
        }

        Object.assign(hotel, updateData);
        await hotel.save();

        res.json({
            success: true,
            data: hotel
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating hotel',
            error: error.message
        });
    }
};

// Delete hotel
exports.deleteHotel = async (req, res) => {
    try {
        const hotel = await Hotel.findOneAndDelete({
            _id: req.params.id,
            owner: req.user.userId
        });

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found or unauthorized'
            });
        }

        res.json({
            success: true,
            message: 'Hotel deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting hotel',
            error: error.message
        });
    }
};

// Room management functions
exports.createRoom = async (req, res) => {
    try {
        const hotel = await Hotel.findOne({
            _id: req.params.id,
            owner: req.user.userId
        });

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found or unauthorized'
            });
        }

        const roomData = req.body;

        // Upload room images
        if (req.files && req.files.length > 0) {
            roomData.images = await Promise.all(
                req.files.map(file => uploadToCloud(file))
            );
        }

        hotel.rooms.push(roomData);
        await hotel.save();

        res.status(201).json({
            success: true,
            data: hotel.rooms[hotel.rooms.length - 1]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating room',
            error: error.message
        });
    }
};

exports.updateRoom = async (req, res) => {
    try {
        const hotel = await Hotel.findOne({
            _id: req.params.id,
            owner: req.user.userId
        });

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found or unauthorized'
            });
        }

        const room = hotel.rooms.id(req.params.roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const updateData = req.body;

        // Upload new room images if provided
        if (req.files && req.files.length > 0) {
            const newImages = await Promise.all(
                req.files.map(file => uploadToCloud(file))
            );
            updateData.images = [...room.images, ...newImages];
        }

        Object.assign(room, updateData);
        await hotel.save();

        res.json({
            success: true,
            data: room
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating room',
            error: error.message
        });
    }
};

exports.deleteRoom = async (req, res) => {
    try {
        const hotel = await Hotel.findOne({
            _id: req.params.id,
            owner: req.user.userId
        });

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found or unauthorized'
            });
        }

        hotel.rooms.pull(req.params.roomId);
        await hotel.save();

        res.json({
            success: true,
            message: 'Room deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting room',
            error: error.message
        });
    }
};

// Availability checking functions
exports.checkAvailability = async (req, res) => {
    try {
        const { checkIn, checkOut, guests } = req.query;
        const hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        const availableRooms = hotel.rooms.filter(room => {
            const isAvailable = room.isAvailable && room.capacity >= Number(guests);
            return isAvailable;
        });

        res.json({
            success: true,
            data: availableRooms
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error checking availability',
            error: error.message
        });
    }
};

exports.checkRoomAvailability = async (req, res) => {
    try {
        const { checkIn, checkOut } = req.query;
        const hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        const room = hotel.rooms.id(req.params.roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const isAvailable = await hotel.checkAvailability(
            room._id,
            new Date(checkIn),
            new Date(checkOut)
        );

        res.json({
            success: true,
            data: { isAvailable }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error checking room availability',
            error: error.message
        });
    }
};

// Review management
exports.createReview = async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        const review = new Review({
            ...req.body,
            user: req.user.userId,
            hotel: hotel._id
        });

        await review.save();
        hotel.reviews.push(review._id);
        await hotel.save();
        await hotel.calculateRating();

        res.status(201).json({
            success: true,
            data: review
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating review',
            error: error.message
        });
    }
};

// Admin functions
exports.getPendingHotels = async (req, res) => {
    try {
        const hotels = await Hotel.find({ isActive: false })
            .populate('owner', 'firstName lastName email');

        res.json({
            success: true,
            data: hotels
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching pending hotels',
            error: error.message
        });
    }
};

exports.approveHotel = async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        hotel.isActive = true;
        await hotel.save();

        res.json({
            success: true,
            message: 'Hotel approved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error approving hotel',
            error: error.message
        });
    }
};

exports.rejectHotel = async (req, res) => {
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
            message: 'Hotel rejected and deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error rejecting hotel',
            error: error.message
        });
    }
}; 