const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { schemas } = require('../middleware/validate');
const { Review, Hotel } = require('../models');
const upload = require('../middleware/upload');

// Get all reviews for a hotel
router.get('/hotel/:hotelId', async (req, res) => {
    try {
        const reviews = await Review.find({ hotel: req.params.hotelId })
            .populate('user', 'firstName lastName avatar')
            .sort('-createdAt');

        res.json({
            success: true,
            data: reviews
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching reviews',
            error: error.message
        });
    }
});

// Get all reviews by a user
router.get('/user/:userId', authenticate, async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.params.userId })
            .populate('hotel', 'name location')
            .sort('-createdAt');

        res.json({
            success: true,
            data: reviews
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching reviews',
            error: error.message
        });
    }
});

// Create a review
router.post('/', authenticate, validate(schemas.review), upload.array('photos', 5), async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.body.hotel);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        const existingReview = await Review.findOne({
            user: req.user.id,
            hotel: req.body.hotel
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this hotel'
            });
        }

        const reviewData = {
            ...req.body,
            user: req.user.id
        };

        // Upload photos if provided
        if (req.files && req.files.length > 0) {
            const { uploadToCloud } = require('../utils/cloudStorage');
            reviewData.photos = await Promise.all(
                req.files.map(file => uploadToCloud(file))
            );
        }

        const review = new Review(reviewData);
        await review.save();

        // Add review to hotel's reviews array
        hotel.reviews.push(review._id);
        await hotel.save();

        // Calculate new rating
        await hotel.calculateAverageRating();

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
});

// Update a review
router.put('/:id', authenticate, validate(schemas.review), upload.array('photos', 5), async (req, res) => {
    try {
        const review = await Review.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found or unauthorized'
            });
        }

        const updateData = req.body;

        // Upload new photos if provided
        if (req.files && req.files.length > 0) {
            const { uploadToCloud } = require('../utils/cloudStorage');
            const newPhotos = await Promise.all(
                req.files.map(file => uploadToCloud(file))
            );
            updateData.photos = [...review.photos, ...newPhotos];
        }

        Object.assign(review, updateData);
        await review.save();

        // Recalculate hotel rating
        const hotel = await Hotel.findById(review.hotel);
        if (hotel) {
            await hotel.calculateAverageRating();
        }

        res.json({
            success: true,
            data: review
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating review',
            error: error.message
        });
    }
});

// Delete a review
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const review = await Review.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found or unauthorized'
            });
        }

        // Remove review from hotel's reviews array
        const hotel = await Hotel.findById(review.hotel);
        if (hotel) {
            hotel.reviews.pull(review._id);
            await hotel.save();
            await hotel.calculateAverageRating();
        }

        await review.remove();

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting review',
            error: error.message
        });
    }
});

// Like/unlike a review
router.post('/:id/like', authenticate, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        const userIndex = review.likes.indexOf(req.user.id);
        if (userIndex === -1) {
            review.likes.push(req.user.id);
        } else {
            review.likes.splice(userIndex, 1);
        }

        await review.save();

        res.json({
            success: true,
            data: review
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error toggling review like',
            error: error.message
        });
    }
});

module.exports = router; 