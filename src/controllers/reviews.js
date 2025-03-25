const Review = require('../models/review');
const Tour = require('../models/tour');
const Booking = require('../models/booking');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createReview = catchAsync(async (req, res, next) => {
    // Allow nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;

    // Check if user has booked the tour
    const booking = await Booking.findOne({
        tour: req.body.tour,
        'contactInfo.userId': req.user.id,
        status: 'completed'
    });

    if (!booking) {
        return next(new AppError('You can only review tours you have booked', 403));
    }

    const review = await Review.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            review
        }
    });
});

exports.getAllReviews = catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const reviews = await Review.find(filter)
        .populate({
            path: 'user',
            select: 'name avatar'
        })
        .populate({
            path: 'tour',
            select: 'name image'
        });

    res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: {
            reviews
        }
    });
});

exports.getReview = catchAsync(async (req, res, next) => {
    const review = await Review.findById(req.params.id)
        .populate({
            path: 'user',
            select: 'name avatar'
        })
        .populate({
            path: 'tour',
            select: 'name image'
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

exports.updateReview = catchAsync(async (req, res, next) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        return next(new AppError('No review found with that ID', 404));
    }

    // Check if user owns the review
    if (review.user.toString() !== req.user.id) {
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

exports.deleteReview = catchAsync(async (req, res, next) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        return next(new AppError('No review found with that ID', 404));
    }

    // Check if user owns the review
    if (review.user.toString() !== req.user.id) {
        return next(new AppError('You can only delete your own reviews', 403));
    }

    await review.remove();

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.likeReview = catchAsync(async (req, res, next) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        return next(new AppError('No review found with that ID', 404));
    }

    const likeIndex = review.likes.indexOf(req.user.id);
    if (likeIndex > -1) {
        review.likes.splice(likeIndex, 1);
    } else {
        review.likes.push(req.user.id);
    }

    await review.save();

    res.status(200).json({
        status: 'success',
        data: {
            review
        }
    });
});

exports.markHelpful = catchAsync(async (req, res, next) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        return next(new AppError('No review found with that ID', 404));
    }

    review.helpful += 1;
    await review.save();

    res.status(200).json({
        status: 'success',
        data: {
            review
        }
    });
}); 