const { Booking, Hotel } = require('../../models');
const { processPayment, refundPayment } = require('../utils/payment');
const { sendEmail } = require('../utils/email');

// Create new booking
exports.createBooking = async (req, res) => {
    try {
        const bookingData = {
            ...req.body,
            user: req.user.userId
        };

        // Check room availability
        const hotel = await Hotel.findById(bookingData.hotel);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        const isAvailable = await hotel.checkAvailability(
            bookingData.room,
            new Date(bookingData.checkIn),
            new Date(bookingData.checkOut)
        );

        if (!isAvailable) {
            return res.status(400).json({
                success: false,
                message: 'Room is not available for selected dates'
            });
        }

        // Create booking
        const booking = new Booking(bookingData);
        await booking.calculateTotalPrice();
        await booking.save();

        // Send confirmation email
        await sendEmail({
            to: req.user.email,
            subject: 'Booking Confirmation',
            html: `
                <h1>Booking Confirmation</h1>
                <p>Your booking has been created successfully.</p>
                <p>Booking ID: ${booking._id}</p>
                <p>Check-in: ${booking.checkIn}</p>
                <p>Check-out: ${booking.checkOut}</p>
                <p>Total Price: ${booking.totalPrice}</p>
            `
        });

        res.status(201).json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating booking',
            error: error.message
        });
    }
};

// Get user's bookings
exports.getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.userId })
            .populate('hotel', 'name images')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings',
            error: error.message
        });
    }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('hotel', 'name images contact')
            .populate('user', 'firstName lastName email');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user has access to this booking
        if (booking.user._id.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching booking',
            error: error.message
        });
    }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user has access to this booking
        if (booking.user.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check if booking can be cancelled
        if (!booking.canBeCancelled()) {
            return res.status(400).json({
                success: false,
                message: 'Booking cannot be cancelled'
            });
        }

        booking.status = 'cancelled';
        booking.cancellationReason = req.body.reason;
        booking.cancellationDate = new Date();
        await booking.save();

        // Process refund if payment was made
        if (booking.paymentStatus === 'paid') {
            await refundPayment(booking);
        }

        // Send cancellation email
        await sendEmail({
            to: req.user.email,
            subject: 'Booking Cancellation',
            html: `
                <h1>Booking Cancellation</h1>
                <p>Your booking has been cancelled successfully.</p>
                <p>Booking ID: ${booking._id}</p>
                <p>Refund will be processed if applicable.</p>
            `
        });

        res.json({
            success: true,
            message: 'Booking cancelled successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cancelling booking',
            error: error.message
        });
    }
};

// Complete booking
exports.completeBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user has access to this booking
        if (booking.user.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        booking.status = 'completed';
        await booking.save();

        // Send completion email
        await sendEmail({
            to: req.user.email,
            subject: 'Booking Completed',
            html: `
                <h1>Booking Completed</h1>
                <p>Thank you for staying with us!</p>
                <p>Booking ID: ${booking._id}</p>
                <p>We hope you enjoyed your stay.</p>
            `
        });

        res.json({
            success: true,
            message: 'Booking completed successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error completing booking',
            error: error.message
        });
    }
};

// Get hotel bookings (for hotel owners)
exports.getHotelBookings = async (req, res) => {
    try {
        const hotel = await Hotel.findOne({
            _id: req.params.hotelId,
            owner: req.user.userId
        });

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found or unauthorized'
            });
        }

        const bookings = await Booking.find({ hotel: hotel._id })
            .populate('user', 'firstName lastName email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching hotel bookings',
            error: error.message
        });
    }
};

// Update booking status (for hotel owners)
exports.updateBookingStatus = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const hotel = await Hotel.findOne({
            _id: booking.hotel,
            owner: req.user.userId
        });

        if (!hotel) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        booking.status = req.body.status;
        await booking.save();

        // Send status update email
        await sendEmail({
            to: booking.user.email,
            subject: 'Booking Status Update',
            html: `
                <h1>Booking Status Update</h1>
                <p>Your booking status has been updated to: ${req.body.status}</p>
                <p>Booking ID: ${booking._id}</p>
            `
        });

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating booking status',
            error: error.message
        });
    }
};

// Process payment
exports.processPayment = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user has access to this booking
        if (booking.user.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const paymentResult = await processPayment(booking, req.body.paymentMethod);
        
        booking.paymentStatus = 'paid';
        booking.paymentDetails = {
            transactionId: paymentResult.transactionId,
            paymentDate: new Date(),
            amount: booking.totalPrice,
            currency: 'USD'
        };
        await booking.save();

        // Send payment confirmation email
        await sendEmail({
            to: req.user.email,
            subject: 'Payment Confirmation',
            html: `
                <h1>Payment Confirmation</h1>
                <p>Your payment has been processed successfully.</p>
                <p>Booking ID: ${booking._id}</p>
                <p>Amount: ${booking.totalPrice}</p>
                <p>Transaction ID: ${paymentResult.transactionId}</p>
            `
        });

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error processing payment',
            error: error.message
        });
    }
};

// Verify payment
exports.verifyPayment = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const verificationResult = await verifyPayment(booking.paymentDetails.transactionId);
        
        if (verificationResult.verified) {
            booking.status = 'confirmed';
            await booking.save();
        }

        res.json({
            success: true,
            data: verificationResult
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error verifying payment',
            error: error.message
        });
    }
};

// Refund payment
exports.refundPayment = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const hotel = await Hotel.findOne({
            _id: booking.hotel,
            owner: req.user.userId
        });

        if (!hotel) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        if (booking.paymentStatus !== 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Payment has not been made'
            });
        }

        await refundPayment(booking);
        booking.paymentStatus = 'refunded';
        await booking.save();

        // Send refund confirmation email
        await sendEmail({
            to: booking.user.email,
            subject: 'Payment Refund',
            html: `
                <h1>Payment Refund</h1>
                <p>Your payment has been refunded successfully.</p>
                <p>Booking ID: ${booking._id}</p>
                <p>Amount: ${booking.totalPrice}</p>
            `
        });

        res.json({
            success: true,
            message: 'Payment refunded successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error refunding payment',
            error: error.message
        });
    }
};

// Get all bookings (admin only)
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('hotel', 'name')
            .populate('user', 'firstName lastName email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings',
            error: error.message
        });
    }
};

// Get booking statistics (admin only)
exports.getBookingStats = async (req, res) => {
    try {
        const stats = await Booking.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$totalPrice' }
                }
            }
        ]);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching booking statistics',
            error: error.message
        });
    }
};

// Update booking (admin only)
exports.updateBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        Object.assign(booking, req.body);
        await booking.save();

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating booking',
            error: error.message
        });
    }
}; 