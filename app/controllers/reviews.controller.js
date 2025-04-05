/**
 * Reviews Controller
 * Handles review-related requests
 */

// Mock reviews data
const reviews = [
  {
    id: 'review_1',
    userId: 'user_123',
    entityId: 'hotel_1',
    entityType: 'hotel',
    rating: 5,
    title: 'Exceptional stay!',
    content: 'Beautiful property with amazing views. The staff was incredibly friendly and helpful. Would definitely return!',
    images: [
      'https://example.com/reviews/review1-img1.jpg'
    ],
    createdAt: '2024-03-01T15:30:22Z',
    verified: true
  },
  {
    id: 'review_2',
    userId: 'user_456',
    entityId: 'hotel_1',
    entityType: 'hotel',
    rating: 4,
    title: 'Great vacation spot',
    content: 'Lovely hotel with excellent amenities. The only downside was the busy pool area.',
    createdAt: '2024-02-15T10:45:33Z',
    verified: true
  },
  {
    id: 'review_3',
    userId: 'user_789',
    entityId: 'hotel_2',
    entityType: 'hotel',
    rating: 4,
    title: 'Perfect for business travel',
    content: 'Clean rooms, fast WiFi, and convenient location. Great value for money.',
    createdAt: '2024-02-10T08:22:15Z',
    verified: true
  }
];

/**
 * Get all reviews
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getReviews = async (req, res, next) => {
  try {
    // Filter by entity type and ID if provided
    let filteredReviews = [...reviews];
    
    if (req.query.entityType) {
      filteredReviews = filteredReviews.filter(review => 
        review.entityType === req.query.entityType
      );
    }
    
    if (req.query.entityId) {
      filteredReviews = filteredReviews.filter(review => 
        review.entityId === req.query.entityId
      );
    }
    
    if (req.query.userId) {
      filteredReviews = filteredReviews.filter(review => 
        review.userId === req.query.userId
      );
    }
    
    // Sort by date (newest first)
    filteredReviews.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    res.status(200).json({
      success: true,
      count: filteredReviews.length,
      data: filteredReviews
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get review details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getReviewDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const review = reviews.find(r => r.id === id);
    
    if (!review) {
      const error = new Error('Review not found');
      error.status = 404;
      error.code = 'REVIEW_NOT_FOUND';
      throw error;
    }
    
    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new review
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.createReview = async (req, res, next) => {
  try {
    const { entityId, entityType, rating, title, content, images } = req.body;
    
    // Validate required fields
    if (!entityId || !entityType || !rating) {
      const error = new Error('Missing required fields');
      error.status = 400;
      error.code = 'MISSING_FIELDS';
      throw error;
    }
    
    // Check if user already reviewed this entity
    const existingReview = reviews.find(r => 
      r.userId === req.user.id && 
      r.entityId === entityId && 
      r.entityType === entityType
    );
    
    if (existingReview) {
      const error = new Error('You have already reviewed this entity');
      error.status = 400;
      error.code = 'REVIEW_EXISTS';
      throw error;
    }
    
    // Create new review
    const newReview = {
      id: `review_${Date.now()}`,
      userId: req.user.id,
      entityId,
      entityType,
      rating: parseInt(rating),
      title: title || '',
      content: content || '',
      images: images || [],
      createdAt: new Date().toISOString(),
      verified: true
    };
    
    // Save to database (mock)
    reviews.push(newReview);
    
    res.status(201).json({
      success: true,
      data: newReview
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a review
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, title, content, images } = req.body;
    
    // Find review
    const reviewIndex = reviews.findIndex(r => r.id === id && r.userId === req.user.id);
    
    if (reviewIndex === -1) {
      const error = new Error('Review not found or you are not authorized to update it');
      error.status = 404;
      error.code = 'REVIEW_NOT_FOUND';
      throw error;
    }
    
    // Update review
    const updatedReview = {
      ...reviews[reviewIndex],
      rating: rating ? parseInt(rating) : reviews[reviewIndex].rating,
      title: title !== undefined ? title : reviews[reviewIndex].title,
      content: content !== undefined ? content : reviews[reviewIndex].content,
      images: images !== undefined ? images : reviews[reviewIndex].images,
      updatedAt: new Date().toISOString()
    };
    
    // Save to database (mock)
    reviews[reviewIndex] = updatedReview;
    
    res.status(200).json({
      success: true,
      data: updatedReview
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a review
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find review
    const reviewIndex = reviews.findIndex(r => r.id === id && r.userId === req.user.id);
    
    if (reviewIndex === -1) {
      const error = new Error('Review not found or you are not authorized to delete it');
      error.status = 404;
      error.code = 'REVIEW_NOT_FOUND';
      throw error;
    }
    
    // Delete review (mock)
    const deletedReview = reviews.splice(reviewIndex, 1)[0];
    
    res.status(200).json({
      success: true,
      data: {
        id: deletedReview.id,
        message: 'Review successfully deleted'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get hotel reviews
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getHotelReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Filter reviews for this hotel
    const hotelReviews = reviews.filter(r => 
      r.entityId === id && r.entityType === 'hotel'
    );
    
    // Sort by date (newest first)
    hotelReviews.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    res.status(200).json({
      success: true,
      count: hotelReviews.length,
      data: hotelReviews
    });
  } catch (error) {
    next(error);
  }
}; 