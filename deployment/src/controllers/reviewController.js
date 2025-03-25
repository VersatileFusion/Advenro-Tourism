const { Review } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Get all reviews
exports.getReviews = catchAsync(async (req, res) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const reviews = await Review.find(filter)
        .populate({
            path: 'user',
            select: 'name photo'
        })
        .populate({
            path: 'tour',
            select: 'name'
        });

    res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: {
            reviews
        }
    });
});

// Get single review
exports.getReview = catchAsync(async (req, res, next) => {
    const review = await Review.findById(req.params.id)
        .populate({
            path: 'user',
            select: 'name photo'
        })
        .populate({
            path: 'tour',
            select: 'name'
        });

    if (!review) {
        return next(new AppError('No review found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            review
        }
    });
});

// Create review
exports.createReview = catchAsync(async (req, res, next) => {
    // Allow nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;

    const newReview = await Review.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            review: newReview
        }
    });
});

// Update review
exports.updateReview = catchAsync(async (req, res, next) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        return next(new AppError('No review found with that ID', 404));
    }

    // Check if user owns the review or is admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError('You can only update your own reviews', 403));
    }

    const updatedReview = await Review.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        status: 'success',
        data: {
            review: updatedReview
        }
    });
});

// Delete review
exports.deleteReview = catchAsync(async (req, res, next) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        return next(new AppError('No review found with that ID', 404));
    }

    // Check if user owns the review or is admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError('You can only delete your own reviews', 403));
    }

    await Review.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null
    });
}); 