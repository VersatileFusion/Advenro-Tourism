const { Booking } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Get all bookings (admin)
exports.getAllBookings = catchAsync(async (req, res) => {
    const bookings = await Booking.find()
        .populate('user', 'name email')
        .populate('item');

    res.status(200).json({
        status: 'success',
        results: bookings.length,
        data: { bookings }
    });
});

// Get user's bookings
exports.getUserBookings = catchAsync(async (req, res) => {
    const bookings = await Booking.find({ user: req.user.id })
        .populate('item');

    res.status(200).json({
        status: 'success',
        results: bookings.length,
        data: { bookings }
    });
});

// Get hotel bookings (hotel owner)
exports.getHotelBookings = catchAsync(async (req, res) => {
    const bookings = await Booking.find({
        item: req.params.hotelId,
        bookingType: 'Hotel'
    }).populate('user', 'name email');

    res.status(200).json({
        status: 'success',
        results: bookings.length,
        data: { bookings }
    });
});

// Get booking by ID
exports.getBookingById = catchAsync(async (req, res, next) => {
    const booking = await Booking.findById(req.params.id)
        .populate('user', 'name email')
        .populate('item');

    if (!booking) {
        return next(new AppError('No booking found with that ID', 404));
    }

    // Check if user owns the booking or is admin/hotel owner
    if (booking.user.id !== req.user.id && 
        req.user.role !== 'admin' && 
        (booking.bookingType === 'Hotel' && req.user.role !== 'hotel_owner')) {
        return next(new AppError('You do not have permission to view this booking', 403));
    }

    res.status(200).json({
        status: 'success',
        data: { booking }
    });
});

// Create booking
exports.createBooking = catchAsync(async (req, res, next) => {
    // Add user to req.body
    req.body.user = req.user.id;

    const booking = await Booking.create(req.body);

    res.status(201).json({
        status: 'success',
        data: { booking }
    });
});

// Update booking (admin)
exports.updateBooking = catchAsync(async (req, res, next) => {
    const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!booking) {
        return next(new AppError('No booking found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { booking }
    });
});

// Cancel booking
exports.cancelBooking = catchAsync(async (req, res, next) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        return next(new AppError('No booking found with that ID', 404));
    }

    // Check if user owns the booking
    if (booking.user.toString() !== req.user.id) {
        return next(new AppError('You can only cancel your own bookings', 403));
    }

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({
        status: 'success',
        data: { booking }
    });
});

// Complete booking
exports.completeBooking = catchAsync(async (req, res, next) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        return next(new AppError('No booking found with that ID', 404));
    }

    // Only hotel owners or admins can complete bookings
    if (req.user.role !== 'hotel_owner' && req.user.role !== 'admin') {
        return next(new AppError('You do not have permission to complete bookings', 403));
    }

    booking.status = 'completed';
    await booking.save();

    res.status(200).json({
        status: 'success',
        data: { booking }
    });
});

// Update booking status (hotel owner)
exports.updateBookingStatus = catchAsync(async (req, res, next) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        return next(new AppError('No booking found with that ID', 404));
    }

    booking.status = req.body.status;
    await booking.save();

    res.status(200).json({
        status: 'success',
        data: { booking }
    });
});

// Get booking statistics (admin)
exports.getBookingStats = catchAsync(async (req, res) => {
    const stats = await Booking.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$price' }
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: { stats }
    });
});

// Process payment
exports.processPayment = catchAsync(async (req, res, next) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        return next(new AppError('No booking found with that ID', 404));
    }

    // Check if user owns the booking
    if (booking.user.toString() !== req.user.id) {
        return next(new AppError('You can only process payment for your own bookings', 403));
    }

    // TODO: Implement payment processing logic
    booking.paymentStatus = 'completed';
    await booking.save();

    res.status(200).json({
        status: 'success',
        data: { booking }
    });
});

// Verify payment
exports.verifyPayment = catchAsync(async (req, res, next) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        return next(new AppError('No booking found with that ID', 404));
    }

    // TODO: Implement payment verification logic

    res.status(200).json({
        status: 'success',
        data: {
            verified: booking.paymentStatus === 'completed'
        }
    });
});

// Refund payment
exports.refundPayment = catchAsync(async (req, res, next) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        return next(new AppError('No booking found with that ID', 404));
    }

    // Only admin can process refunds
    if (req.user.role !== 'admin') {
        return next(new AppError('You do not have permission to process refunds', 403));
    }

    // TODO: Implement refund logic
    booking.paymentStatus = 'refunded';
    await booking.save();

    res.status(200).json({
        status: 'success',
        data: { booking }
    });
}); 