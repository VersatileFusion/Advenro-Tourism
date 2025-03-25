const asyncHandler = require('../middleware/async');
const bookingComService = require('../services/bookingComService');
const ErrorResponse = require('../utils/errorResponse');
const rateLimit = require('express-rate-limit');
const { Booking } = require('../models');
const AppError = require('../utils/appError');

// Enhanced rate limiters with different tiers
const createRateLimiter = (options) => rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || 'Too many requests, please try again later',
    keyGenerator: (req) => {
        // Use API key if available, otherwise use IP
        return req.headers['x-api-key'] || req.ip;
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
            limit: req.rateLimit.limit,
            remaining: req.rateLimit.remaining
        });
    }
});

// Different rate limits for different types of endpoints
exports.searchLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many search requests, please try again after 15 minutes'
});

exports.detailsLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: 'Too many detail requests, please try again after 15 minutes'
});

exports.cacheLimiter = createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20,
    message: 'Too many cache operations, please try again after 5 minutes'
});

// @desc    Search hotels
// @route   GET /api/v1/booking/hotels/search
// @access  Public
exports.searchHotels = asyncHandler(async (req, res, next) => {
    if (!req.query.destId || !req.query.checkIn || !req.query.checkOut) {
        return next(new ErrorResponse('Please provide destination ID, check-in and check-out dates', 400));
    }

    try {
        // Validate dates before calling the service
        const checkInDate = new Date(req.query.checkIn);
        const checkOutDate = new Date(req.query.checkOut);
        
        if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
            return next(new ErrorResponse('Invalid date format. Please use YYYY-MM-DD format', 400));
        }

        if (checkInDate >= checkOutDate) {
            return next(new ErrorResponse('Check-out date must be after check-in date', 400));
        }

        const hotels = await bookingComService.searchHotels(req.query);
        
        if (!Array.isArray(hotels)) {
            return next(new ErrorResponse('Invalid response format from search service', 500));
        }

        res.status(200).json({
            success: true,
            count: hotels.length,
            data: hotels
        });
    } catch (error) {
        // Enhanced error handling
        console.error('Hotel search error:', error.message);
        
        // Handle validation errors
        if (error.message.includes('Invalid date format')) {
            return next(new ErrorResponse(error.message, 400));
        }
        
        // Handle API errors with proper response structure
        if (error.response && error.response.data) {
            return next(new ErrorResponse(
                error.response.data.message || 'API Error', 
                error.response.status || 500
            ));
        }
        
        // Handle network or timeout errors
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            return next(new ErrorResponse('API service unavailable. Please try again later.', 503));
        }
        
        // Handle other errors
        return next(new ErrorResponse(error.message || 'Internal server error', 500));
    }
});

// @desc    Get hotel details
// @route   GET /api/v1/booking/hotels/:id
// @access  Public
exports.getHotelDetails = asyncHandler(async (req, res, next) => {
    const hotel = await bookingComService.getHotelDetails(req.params.id);
    res.status(200).json({
        success: true,
        data: hotel
    });
});

// @desc    Search locations
// @route   GET /api/v1/booking/locations
// @access  Public
exports.searchLocations = asyncHandler(async (req, res, next) => {
    if (!req.query.query) {
        return next(new ErrorResponse('Please provide a search query', 400));
    }

    const locations = await bookingComService.searchLocations(req.query.query);
    res.status(200).json({
        success: true,
        data: locations
    });
});

// @desc    Get hotel reviews
// @route   GET /api/v1/booking/hotels/:id/reviews
// @access  Public
exports.getHotelReviews = asyncHandler(async (req, res, next) => {
    const reviews = await bookingComService.getHotelReviews(req.params.id, req.query);
    res.status(200).json({
        success: true,
        data: reviews
    });
});

// @desc    Get hotel description
// @route   GET /api/v1/booking/hotels/:id/description
// @access  Public
exports.getHotelDescription = asyncHandler(async (req, res, next) => {
    const description = await bookingComService.getHotelDescription(req.params.id);
    res.status(200).json({
        success: true,
        data: description
    });
});

// @desc    Get hotel photos
// @route   GET /api/v1/booking/hotels/:id/photos
// @access  Public
exports.getHotelPhotos = asyncHandler(async (req, res, next) => {
    const photos = await bookingComService.getHotelPhotos(req.params.id);
    res.status(200).json({
        success: true,
        data: photos
    });
});

// @desc    Get room availability
// @route   GET /api/v1/booking/hotels/:id/rooms
// @access  Public
exports.getRoomAvailability = asyncHandler(async (req, res, next) => {
    if (!req.query.checkIn || !req.query.checkOut) {
        return next(new ErrorResponse('Please provide check-in and check-out dates', 400));
    }

    const availability = await bookingComService.getRoomAvailability(req.params.id, req.query);
    res.status(200).json({
        success: true,
        data: availability
    });
});

// @desc    Get hotel facilities
// @route   GET /api/v1/booking/hotels/:id/facilities
// @access  Public
exports.getHotelFacilities = asyncHandler(async (req, res, next) => {
    const facilities = await bookingComService.getHotelFacilities(req.params.id);
    res.status(200).json({
        success: true,
        data: facilities
    });
});

// @desc    Get nearby attractions
// @route   GET /api/v1/booking/hotels/:id/nearby
// @access  Public
exports.getNearbyAttractions = asyncHandler(async (req, res, next) => {
    const attractions = await bookingComService.getNearbyAttractions(req.params.id, req.query);
    res.status(200).json({
        success: true,
        data: attractions
    });
});

// @desc    Get currency exchange rates
// @route   GET /api/v1/booking/exchange-rates
// @access  Public
exports.getExchangeRates = asyncHandler(async (req, res, next) => {
    const rates = await bookingComService.getExchangeRates(req.query.currency);
    res.status(200).json({
        success: true,
        data: rates
    });
});

// @desc    Get property types
// @route   GET /api/v1/booking/property-types
// @access  Public
exports.getPropertyTypes = asyncHandler(async (req, res, next) => {
    const types = await bookingComService.getPropertyTypes();
    res.status(200).json({
        success: true,
        data: types
    });
});

// @desc    Get hotel policies
// @route   GET /api/v1/booking/hotels/:id/policies
// @access  Public
exports.getHotelPolicies = asyncHandler(async (req, res, next) => {
    const policies = await bookingComService.getHotelPolicies(req.params.id);
    res.status(200).json({
        success: true,
        data: policies
    });
});

// @desc    Get hotel chain details
// @route   GET /api/v1/booking/chains/:id
// @access  Public
exports.getHotelChain = asyncHandler(async (req, res, next) => {
    const chain = await bookingComService.getHotelChain(req.params.id);
    res.status(200).json({
        success: true,
        data: chain
    });
});

// @desc    List hotel chains
// @route   GET /api/v1/booking/chains
// @access  Public
exports.listHotelChains = asyncHandler(async (req, res, next) => {
    const chains = await bookingComService.listHotelChains(req.query);
    res.status(200).json({
        success: true,
        data: chains
    });
});

// @desc    Get room types
// @route   GET /api/v1/booking/hotels/:id/room-types
// @access  Public
exports.getRoomTypes = asyncHandler(async (req, res, next) => {
    const types = await bookingComService.getRoomTypes(req.params.id);
    res.status(200).json({
        success: true,
        data: types
    });
});

// @desc    Get hotel amenities
// @route   GET /api/v1/booking/hotels/:id/amenities
// @access  Public
exports.getHotelAmenities = asyncHandler(async (req, res, next) => {
    const amenities = await bookingComService.getHotelAmenities(req.params.id);
    res.status(200).json({
        success: true,
        data: amenities
    });
});

// @desc    Get hotel sustainability practices
// @route   GET /api/v1/booking/hotels/:id/sustainability
// @access  Public
exports.getHotelSustainability = asyncHandler(async (req, res, next) => {
    const sustainability = await bookingComService.getHotelSustainability(req.params.id);
    res.status(200).json({
        success: true,
        data: sustainability
    });
});

// @desc    Clear cache
// @route   DELETE /api/v1/booking/cache
// @access  Private
exports.clearCache = asyncHandler(async (req, res, next) => {
    bookingComService.clearCache(req.query.pattern);
    res.status(200).json({
        success: true,
        message: 'Cache cleared successfully'
    });
});

// @desc    Get hotel score breakdown
// @route   GET /api/v1/booking/hotels/:id/score
// @access  Public
exports.getHotelScore = asyncHandler(async (req, res, next) => {
    const score = await bookingComService.getHotelScore(req.params.id);
    res.status(200).json({
        success: true,
        data: score
    });
});

// @desc    Get hotel payment options
// @route   GET /api/v1/booking/hotels/:id/payment-options
// @access  Public
exports.getHotelPaymentOptions = asyncHandler(async (req, res, next) => {
    const options = await bookingComService.getHotelPaymentOptions(req.params.id);
    res.status(200).json({
        success: true,
        data: options
    });
});

// @desc    Get hotel accessibility features
// @route   GET /api/v1/booking/hotels/:id/accessibility
// @access  Public
exports.getHotelAccessibility = asyncHandler(async (req, res, next) => {
    const features = await bookingComService.getHotelAccessibility(req.params.id);
    res.status(200).json({
        success: true,
        data: features
    });
});

// @desc    Get similar hotels
// @route   GET /api/v1/booking/hotels/:id/similar
// @access  Public
exports.getSimilarHotels = asyncHandler(async (req, res, next) => {
    const hotels = await bookingComService.getSimilarHotels(req.params.id);
    res.status(200).json({
        success: true,
        data: hotels
    });
});

// @desc    Get cache statistics
// @route   GET /api/v1/booking/cache/stats
// @access  Private
exports.getCacheStats = asyncHandler(async (req, res, next) => {
    const stats = await bookingComService.getCacheStats();
    res.status(200).json({
        success: true,
        data: stats
    });
});

// @desc    Create a new booking
// @route   POST /api/v1/booking/hotels/:id/book
// @access  Private
exports.createBooking = asyncHandler(async (req, res, next) => {
    const booking = await Booking.create({
        ...req.body,
        user: req.user.id,
        hotel: req.params.id
    });

    res.status(201).json({
        success: true,
        data: booking
    });
});

// @desc    Get user's bookings
// @route   GET /api/v1/booking/my-bookings
// @access  Private
exports.getUserBookings = asyncHandler(async (req, res, next) => {
    const bookings = await Booking.find({ user: req.user.id })
        .populate('hotel', 'name location rating')
        .sort('-createdAt');

    res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings
    });
});

// @desc    Get booking details
// @route   GET /api/v1/booking/my-bookings/:id
// @access  Private
exports.getBookingDetails = asyncHandler(async (req, res, next) => {
    const booking = await Booking.findOne({
        _id: req.params.id,
        user: req.user.id
    }).populate('hotel', 'name location rating amenities');

    if (!booking) {
        return next(new AppError('Booking not found', 404));
    }

    res.status(200).json({
        success: true,
        data: booking
    });
});

// @desc    Cancel booking
// @route   PUT /api/v1/booking/my-bookings/:id/cancel
// @access  Private
exports.cancelBooking = asyncHandler(async (req, res, next) => {
    const booking = await Booking.findOne({
        _id: req.params.id,
        user: req.user.id
    });

    if (!booking) {
        return next(new AppError('Booking not found', 404));
    }

    if (booking.status === 'cancelled') {
        return next(new AppError('Booking is already cancelled', 400));
    }

    booking.status = 'cancelled';
    booking.cancelledAt = Date.now();
    await booking.save();

    res.status(200).json({
        success: true,
        data: booking
    });
}); 