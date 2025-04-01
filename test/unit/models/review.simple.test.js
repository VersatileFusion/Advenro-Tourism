const { expect } = require('chai');

describe('Review Model Validation', () => {
  // Mock validator function that mimics Mongoose validation
  const validateReview = (review) => {
    const errors = {};
    
    // Required fields
    if (!review.hotelId) errors.hotelId = 'Hotel ID is required';
    if (!review.userId) errors.userId = 'User ID is required';
    if (review.rating === undefined || review.rating === null) errors.rating = 'Rating is required';
    if (!review.comment) errors.comment = 'Comment is required';
    
    // Rating validation
    if (review.rating !== undefined && review.rating !== null) {
      if (isNaN(review.rating)) {
        errors.rating = 'Rating must be a number';
      } else if (review.rating < 1 || review.rating > 5) {
        errors.rating = 'Rating must be between 1 and 5';
      }
    }
    
    // Comment validation
    if (review.comment && typeof review.comment !== 'string') {
      errors.comment = 'Comment must be a string';
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  };
  
  it('should validate a valid review', () => {
    const validReview = {
      hotelId: '60d21b4667d0d8992e610c85',
      userId: '60d21b4667d0d8992e610c86',
      rating: 4,
      comment: 'Great hotel with excellent service!'
    };
    
    const errors = validateReview(validReview);
    expect(errors).to.be.null;
  });
  
  it('should invalidate a review without required fields', () => {
    const invalidReview = {
      rating: 5
    };
    
    const errors = validateReview(invalidReview);
    expect(errors).to.have.property('hotelId', 'Hotel ID is required');
    expect(errors).to.have.property('userId', 'User ID is required');
    expect(errors).to.have.property('comment', 'Comment is required');
  });
  
  it('should invalidate a review with rating out of range', () => {
    const invalidRatingReview = {
      hotelId: '60d21b4667d0d8992e610c85',
      userId: '60d21b4667d0d8992e610c86',
      rating: 6,
      comment: 'Amazing hotel!'
    };
    
    const errors = validateReview(invalidRatingReview);
    expect(errors).to.have.property('rating', 'Rating must be between 1 and 5');
  });
  
  it('should invalidate a review with rating below minimum', () => {
    const lowRatingReview = {
      hotelId: '60d21b4667d0d8992e610c85',
      userId: '60d21b4667d0d8992e610c86',
      rating: 0,
      comment: 'Poor experience'
    };
    
    const errors = validateReview(lowRatingReview);
    expect(errors).to.have.property('rating', 'Rating must be between 1 and 5');
  });
  
  it('should invalidate a review with non-numeric rating', () => {
    const nonNumericRatingReview = {
      hotelId: '60d21b4667d0d8992e610c85',
      userId: '60d21b4667d0d8992e610c86',
      rating: 'excellent',
      comment: 'Great place!'
    };
    
    const errors = validateReview(nonNumericRatingReview);
    expect(errors).to.have.property('rating', 'Rating must be a number');
  });
}); 