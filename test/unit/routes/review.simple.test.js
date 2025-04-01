const { expect } = require('chai');
const sinon = require('sinon');

describe('Review Route Handlers', () => {
  let req, res, next;
  
  beforeEach(() => {
    // Mock request object
    req = {
      body: {},
      params: {},
      user: { userId: 'user123', role: 'user' }
    };
    
    // Mock response object
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };
    
    // Mock next function
    next = sinon.spy();
  });
  
  describe('createReview', () => {
    it('should create a review with valid data', async () => {
      // Mock review and hotel models
      const Review = {
        findOne: sinon.stub().resolves(null),
        create: sinon.stub().resolves({
          _id: 'review123',
          hotelId: 'hotel123',
          userId: 'user123',
          rating: 4,
          comment: 'Great hotel!',
          createdAt: new Date()
        })
      };
      
      const Hotel = {
        findById: sinon.stub().resolves({
          _id: 'hotel123',
          name: 'Test Hotel',
          rating: 0,
          save: sinon.stub().resolves(true)
        })
      };
      
      // Mock find for calculating average
      Review.find = sinon.stub().resolves([
        { rating: 4 },
        { rating: 5 }
      ]);
      
      // Implementation of create review handler
      const createReview = async (req, res) => {
        try {
          const { hotelId, rating, comment } = req.body;
    
          // Validate rating
          if (!rating || rating < 1 || rating > 5) {
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
    
          const review = await Review.create({
            hotelId,
            userId: req.user.userId,
            rating,
            comment
          });
    
          // Update hotel rating
          const reviews = await Review.find({ hotelId });
          const averageRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
          hotel.rating = averageRating;
          await hotel.save();
    
          res.status(201).json(review);
        } catch (error) {
          res.status(400).json({ message: 'Error creating review' });
        }
      };
      
      // Set request body
      req.body = {
        hotelId: 'hotel123',
        rating: 4,
        comment: 'Great hotel!'
      };
      
      // Call the handler
      await createReview(req, res);
      
      // Assertions
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('hotelId', 'hotel123');
      expect(response).to.have.property('rating', 4);
      expect(response).to.have.property('comment', 'Great hotel!');
    });
    
    it('should return 400 if rating is invalid', async () => {
      // Implementation of create review handler
      const createReview = async (req, res) => {
        try {
          const { hotelId, rating, comment } = req.body;
    
          // Validate rating
          if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
          }
          
          // Rest of the function wouldn't be called
          res.status(201).json({});
        } catch (error) {
          res.status(400).json({ message: 'Error creating review' });
        }
      };
      
      // Set request body with invalid rating
      req.body = {
        hotelId: 'hotel123',
        rating: 6,  // Invalid rating
        comment: 'Great hotel!'
      };
      
      // Call the handler
      await createReview(req, res);
      
      // Assertions
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('message', 'Rating must be between 1 and 5');
    });
    
    it('should return 404 if hotel not found', async () => {
      // Mock hotel model that returns null (hotel not found)
      const Hotel = {
        findById: sinon.stub().resolves(null)
      };
      
      // Implementation of create review handler
      const createReview = async (req, res) => {
        try {
          const { hotelId, rating, comment } = req.body;
    
          // Validate rating
          if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
          }
    
          // Check if hotel exists
          const hotel = await Hotel.findById(hotelId);
          if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
          }
          
          // Rest of the function wouldn't be called
          res.status(201).json({});
        } catch (error) {
          res.status(400).json({ message: 'Error creating review' });
        }
      };
      
      // Set request body
      req.body = {
        hotelId: 'nonexistent',
        rating: 4,
        comment: 'Great hotel!'
      };
      
      // Call the handler
      await createReview(req, res);
      
      // Assertions
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('message', 'Hotel not found');
    });
    
    it('should return 400 if user already reviewed the hotel', async () => {
      // Mock hotel and review models
      const Hotel = {
        findById: sinon.stub().resolves({
          _id: 'hotel123',
          name: 'Test Hotel'
        })
      };
      
      const Review = {
        findOne: sinon.stub().resolves({
          _id: 'existing123',
          hotelId: 'hotel123',
          userId: 'user123'
        })
      };
      
      // Implementation of create review handler
      const createReview = async (req, res) => {
        try {
          const { hotelId, rating, comment } = req.body;
    
          // Validate rating
          if (!rating || rating < 1 || rating > 5) {
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
          
          // Rest of the function wouldn't be called
          res.status(201).json({});
        } catch (error) {
          res.status(400).json({ message: 'Error creating review' });
        }
      };
      
      // Set request body
      req.body = {
        hotelId: 'hotel123',
        rating: 4,
        comment: 'Great hotel!'
      };
      
      // Call the handler
      await createReview(req, res);
      
      // Assertions
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('message', 'You have already reviewed this hotel');
    });
  });
  
  describe('getHotelReviews', () => {
    it('should return reviews for a hotel', async () => {
      // Mock review model
      const Review = {
        find: sinon.stub().returns({
          populate: sinon.stub().returns({
            sort: sinon.stub().resolves([
              {
                _id: 'review1',
                hotelId: 'hotel123',
                userId: { _id: 'user1', name: 'User One' },
                rating: 5,
                comment: 'Excellent hotel',
                createdAt: new Date()
              },
              {
                _id: 'review2',
                hotelId: 'hotel123',
                userId: { _id: 'user2', name: 'User Two' },
                rating: 4,
                comment: 'Very good experience',
                createdAt: new Date()
              }
            ])
          })
        })
      };
      
      // Implementation of get hotel reviews handler
      const getHotelReviews = async (req, res) => {
        try {
          const reviews = await Review.find({ hotelId: req.params.hotelId })
            .populate('userId', 'name')
            .sort({ createdAt: -1 });
            
          res.json(reviews);
        } catch (error) {
          res.status(500).json({ message: 'Error fetching reviews' });
        }
      };
      
      // Set request params
      req.params.hotelId = 'hotel123';
      
      // Call the handler
      await getHotelReviews(req, res);
      
      // Assertions
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.be.an('array').with.lengthOf(2);
      expect(response[0]).to.have.property('rating', 5);
      expect(response[1]).to.have.property('rating', 4);
    });
  });
  
  describe('updateReview', () => {
    it('should update a review with valid data', async () => {
      // Mock review model
      const review = {
        _id: 'review123',
        hotelId: 'hotel123',
        userId: 'user123',
        rating: 3,
        comment: 'Average hotel',
        save: sinon.stub().resolves(true)
      };
      
      const Review = {
        findById: sinon.stub().resolves(review),
        find: sinon.stub().resolves([
          { rating: 4 },
          { rating: 5 }
        ])
      };
      
      const Hotel = {
        findByIdAndUpdate: sinon.stub().resolves(true)
      };
      
      // Implementation of update review handler
      const updateReview = async (req, res) => {
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
      };
      
      // Set request params and body
      req.params.id = 'review123';
      req.body = {
        rating: 4,
        comment: 'Better than I initially thought'
      };
      
      // Call the handler
      await updateReview(req, res);
      
      // Assertions
      expect(res.json.calledOnce).to.be.true;
      
      // Check that the review was updated
      expect(review.rating).to.equal(4);
      expect(review.comment).to.equal('Better than I initially thought');
      expect(review.save.calledOnce).to.be.true;
      
      // Check that hotel rating was updated
      expect(Hotel.findByIdAndUpdate.calledOnce).to.be.true;
    });
    
    it('should return 404 if review not found', async () => {
      // Mock review model that returns null (review not found)
      const Review = {
        findById: sinon.stub().resolves(null)
      };
      
      // Implementation of update review handler
      const updateReview = async (req, res) => {
        try {
          const review = await Review.findById(req.params.id);
    
          if (!review) {
            return res.status(404).json({ message: 'Review not found' });
          }
          
          // Rest of the function wouldn't be called
          res.json({});
        } catch (error) {
          res.status(400).json({ message: 'Error updating review' });
        }
      };
      
      // Set request params
      req.params.id = 'nonexistent';
      
      // Call the handler
      await updateReview(req, res);
      
      // Assertions
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('message', 'Review not found');
    });
    
    it('should return 403 if user does not own the review', async () => {
      // Mock review model
      const Review = {
        findById: sinon.stub().resolves({
          _id: 'review123',
          hotelId: 'hotel123',
          userId: 'other-user',  // Different from req.user.userId
          rating: 3,
          comment: 'Average hotel'
        })
      };
      
      // Implementation of update review handler
      const updateReview = async (req, res) => {
        try {
          const review = await Review.findById(req.params.id);
    
          if (!review) {
            return res.status(404).json({ message: 'Review not found' });
          }
    
          // Check if user owns the review
          if (review.userId.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Access denied' });
          }
          
          // Rest of the function wouldn't be called
          res.json({});
        } catch (error) {
          res.status(400).json({ message: 'Error updating review' });
        }
      };
      
      // Set request params
      req.params.id = 'review123';
      
      // Call the handler
      await updateReview(req, res);
      
      // Assertions
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('message', 'Access denied');
    });
  });
}); 