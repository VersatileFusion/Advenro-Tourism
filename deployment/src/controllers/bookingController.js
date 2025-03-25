const { Booking, Hotel, Flight, Tour } = require('../models');

// @desc    Get all bookings
// @route   GET /api/v1/bookings
// @access  Private/Admin
exports.getBookings = async (req, res) => {
    try {
        console.log('🔍 Fetching all bookings with query:', req.query);
        
        let query;
        
        // If user is not admin, show only their bookings
        if (req.user.role !== 'admin') {
            query = Booking.find({ user: req.user.id });
        } else {
            query = Booking.find();
        }

        // Filter by booking type
        if (req.query.type) {
            console.log(`🏷️ Filtering by type: ${req.query.type}`);
            query = query.where('bookingType').equals(req.query.type);
        }

        // Filter by status
        if (req.query.status) {
            console.log(`📊 Filtering by status: ${req.query.status}`);
            query = query.where('status').equals(req.query.status);
        }

        // Filter by payment status
        if (req.query.paymentStatus) {
            console.log(`💰 Filtering by payment status: ${req.query.paymentStatus}`);
            query = query.where('paymentStatus').equals(req.query.paymentStatus);
        }

        // Filter by date range
        if (req.query.startDate) {
            console.log(`📅 Filtering by start date: ${req.query.startDate}`);
            query = query.where('startDate').gte(new Date(req.query.startDate));
        }
        if (req.query.endDate) {
            console.log(`📅 Filtering by end date: ${req.query.endDate}`);
            query = query.where('endDate').lte(new Date(req.query.endDate));
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

        // Populate user and item details
        query = query.populate({
            path: 'user',
            select: 'name email'
        }).populate({
            path: 'itemId',
            select: 'name price'
        });

        console.log('📊 Executing booking query...');
        const bookings = await query;
        const total = await Booking.countDocuments();

        console.log(`✅ Found ${bookings.length} bookings`);
        res.status(200).json({
            success: true,
            count: bookings.length,
            total,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            data: bookings
        });
    } catch (error) {
        console.error('❌ Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Get single booking
// @route   GET /api/v1/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
    try {
        console.log(`🔍 Fetching booking with ID: ${req.params.id}`);
        
        const booking = await Booking.findById(req.params.id)
            .populate({
                path: 'user',
                select: 'name email'
            })
            .populate({
                path: 'itemId',
                select: 'name price'
            });

        if (!booking) {
            console.log('❌ Booking not found');
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        // Make sure user is booking owner or admin
        if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            console.log('❌ Not authorized to access this booking');
            return res.status(401).json({
                success: false,
                error: 'Not authorized to access this booking'
            });
        }

        console.log('✅ Booking found');
        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('❌ Error fetching booking:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Create new booking
// @route   POST /api/v1/bookings
// @access  Private
exports.createBooking = async (req, res) => {
    try {
        console.log('🎯 Creating new booking...');
        console.log('Request body:', req.body);

        // Add user to req.body
        req.body.user = req.user.id;

        // Check if item exists and is available
        let item;
        switch (req.body.bookingType) {
            case 'Hotel':
                item = await Hotel.findById(req.body.itemId);
                if (!item) {
                    return res.status(404).json({
                        success: false,
                        error: 'Hotel not found'
                    });
                }
                // Check room availability
                const roomAvailable = item.rooms.some(room => room.available);
                if (!roomAvailable) {
                    return res.status(400).json({
                        success: false,
                        error: 'No rooms available'
                    });
                }
                break;

            case 'Flight':
                item = await Flight.findById(req.body.itemId);
                if (!item) {
                    return res.status(404).json({
                        success: false,
                        error: 'Flight not found'
                    });
                }
                // Check seat availability
                if (item.seats.available < 1) {
                    return res.status(400).json({
                        success: false,
                        error: 'No seats available'
                    });
                }
                break;

            case 'Tour':
                item = await Tour.findById(req.body.itemId);
                if (!item) {
                    return res.status(404).json({
                        success: false,
                        error: 'Tour not found'
                    });
                }
                break;

            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid booking type'
                });
        }

        const booking = await Booking.create(req.body);

        // Update item availability
        switch (req.body.bookingType) {
            case 'Hotel':
                // Update room availability
                await Hotel.findByIdAndUpdate(req.body.itemId, {
                    $set: { 'rooms.$[elem].available': false }
                }, {
                    arrayFilters: [{ 'elem.available': true }],
                    new: true
                });
                break;

            case 'Flight':
                // Update seat availability
                await Flight.findByIdAndUpdate(req.body.itemId, {
                    $inc: { 'seats.available': -1 }
                });
                break;

            case 'Tour':
                // Update tour capacity if needed
                break;
        }

        console.log(`✅ Booking created with ID: ${booking._id}`);
        res.status(201).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('❌ Error creating booking:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Update booking status
// @route   PUT /api/v1/bookings/:id
// @access  Private
exports.updateBooking = async (req, res) => {
    try {
        console.log(`🔄 Updating booking with ID: ${req.params.id}`);
        console.log('Update data:', req.body);

        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            console.log('❌ Booking not found');
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        // Make sure user is booking owner or admin
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            console.log('❌ Not authorized to update this booking');
            return res.status(401).json({
                success: false,
                error: 'Not authorized to update this booking'
            });
        }

        // Only allow status and paymentStatus updates
        const allowedUpdates = ['status', 'paymentStatus'];
        const updates = Object.keys(req.body)
            .filter(key => allowedUpdates.includes(key))
            .reduce((obj, key) => {
                obj[key] = req.body[key];
                return obj;
            }, {});

        booking = await Booking.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true
        });

        console.log('✅ Booking updated successfully');
        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('❌ Error updating booking:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Cancel booking
// @route   DELETE /api/v1/bookings/:id
// @access  Private
exports.cancelBooking = async (req, res) => {
    try {
        console.log(`🗑️ Cancelling booking with ID: ${req.params.id}`);
        
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            console.log('❌ Booking not found');
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        // Make sure user is booking owner or admin
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            console.log('❌ Not authorized to cancel this booking');
            return res.status(401).json({
                success: false,
                error: 'Not authorized to cancel this booking'
            });
        }

        // Update booking status to cancelled
        booking.status = 'cancelled';
        await booking.save();

        // Update item availability based on booking type
        switch (booking.bookingType) {
            case 'Hotel':
                // Restore room availability
                await Hotel.findByIdAndUpdate(booking.itemId, {
                    $set: { 'rooms.$[elem].available': true }
                }, {
                    arrayFilters: [{ 'elem.available': false }],
                    new: true
                });
                break;

            case 'Flight':
                // Restore seat availability
                await Flight.findByIdAndUpdate(booking.itemId, {
                    $inc: { 'seats.available': 1 }
                });
                break;

            case 'Tour':
                // Update tour capacity if needed
                break;
        }

        console.log('✅ Booking cancelled successfully');
        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('❌ Error cancelling booking:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
}; 