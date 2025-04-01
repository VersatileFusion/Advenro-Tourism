const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Hotel = require('../models/Hotel');
const { authenticate } = require('../middleware/auth');
const admin = require('../middleware/admin');

// Create review
router.post('/', authenticate, async (req, res) => {
  try {
    const { hotelId, rating, comment } = req.body;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if hotel exists
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Check if user has already reviewed this hotel
    const existingReview = await Review.findOne({
      hotelId,
      userId: req.user.userId
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this hotel' });
    }

    const review = new Review({
      hotelId,
      userId: req.user.userId,
      rating,
      comment
    });

    await review.save();

    // Update hotel rating
    const reviews = await Review.find({ hotelId });
    const averageRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
    hotel.rating = averageRating;
    await hotel.save();

    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ message: 'Error creating review' });
  }
});

// Get hotel reviews
router.get('/hotel/:hotelId', async (req, res) => {
  try {
    const reviews = await Review.find({ hotelId: req.params.hotelId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// Get user's reviews
router.get('/user', authenticate, async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user.userId })
      .populate('hotelId', 'name location');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// Update review
router.put('/:id', authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user owns the review
    if (review.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { rating, comment } = req.body;

    if (rating) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }
      review.rating = rating;
    }

    if (comment) {
      review.comment = comment;
    }

    await review.save();

    // Update hotel rating
    const reviews = await Review.find({ hotelId: review.hotelId });
    const averageRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
    await Hotel.findByIdAndUpdate(review.hotelId, { rating: averageRating });

    res.json(review);
  } catch (error) {
    res.status(400).json({ message: 'Error updating review' });
  }
});

// Delete review
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user owns the review or is admin
    if (review.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const hotelId = review.hotelId;
    await review.remove();

    // Update hotel rating
    const reviews = await Review.find({ hotelId });
    const averageRating = reviews.length > 0
      ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
      : 0;
    await Hotel.findByIdAndUpdate(hotelId, { rating: averageRating });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review' });
  }
});

module.exports = router; 