const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Import the service
const activityService = require('../../../src/services/activityService');

// Import models
const Activity = require('../../../src/models/Activity');
const Destination = require('../../../src/models/Destination');
const User = require('../../../src/models/User');
const Booking = require('../../../src/models/Booking');
const Review = require('../../../src/models/Review');

// Load test setup
require('../../config/setup');

describe('Activity Service Tests', function() {
  this.timeout(10000);

  // Test data
  let mockActivity;
  let mockDestination;
  let mockUser;
  let mockBooking;
  let mockReview;

  beforeEach(() => {
    // Create mock data
    mockDestination = {
      _id: new ObjectId(),
      name: 'Test Destination',
      country: 'Test Country'
    };

    mockUser = {
      _id: new ObjectId(),
      name: 'Test User',
      email: 'test@example.com'
    };

    mockActivity = {
      _id: new ObjectId(),
      name: 'Test Activity',
      description: 'A test activity',
      destination: mockDestination._id,
      category: 'Adventure',
      duration: 3,
      price: 100,
      currency: 'USD',
      difficulty: 'Moderate',
      groupSize: { min: 2, max: 10 },
      includes: ['Guide', 'Equipment'],
      excludes: ['Food', 'Transportation'],
      images: ['image1.jpg', 'image2.jpg'],
      location: {
        coordinates: [40.7128, -74.0060],
        address: '123 Test St'
      },
      availableDates: [
        {
          date: new Date(),
          slots: 10,
          booked: 0
        }
      ],
      rating: 4.5,
      active: true
    };

    mockBooking = {
      _id: new ObjectId(),
      activity: mockActivity._id,
      user: mockUser._id,
      date: new Date(),
      participants: 2,
      totalPrice: 200,
      status: 'confirmed',
      createdAt: new Date()
    };

    mockReview = {
      _id: new ObjectId(),
      activity: mockActivity._id,
      user: mockUser._id,
      rating: 5,
      comment: 'Excellent activity!',
      createdAt: new Date()
    };

    // Setup stubs
    sinon.stub(Activity, 'findById').resolves(mockActivity);
    sinon.stub(Activity, 'find').returns({
      sort: sinon.stub().returnsThis(),
      skip: sinon.stub().returnsThis(),
      limit: sinon.stub().resolves([mockActivity]),
      lean: sinon.stub().resolves([mockActivity]),
      populate: sinon.stub().returnsThis()
    });
    sinon.stub(Activity, 'findOne').resolves(mockActivity);
    sinon.stub(Activity, 'create').resolves(mockActivity);
    sinon.stub(Activity, 'findByIdAndUpdate').resolves(mockActivity);
    sinon.stub(Activity, 'findByIdAndDelete').resolves(mockActivity);
    sinon.stub(Activity, 'countDocuments').resolves(1);

    sinon.stub(Booking, 'find').resolves([mockBooking]);
    sinon.stub(Booking, 'create').resolves(mockBooking);
    sinon.stub(Review, 'find').resolves([mockReview]);
    sinon.stub(Review, 'create').resolves(mockReview);
  });

  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });

  describe('getActivityById', () => {
    it('should retrieve an activity by ID', async () => {
      const result = await activityService.getActivityById(mockActivity._id.toString());

      expect(result).to.exist;
      expect(result).to.deep.equal(mockActivity);
      expect(Activity.findById.calledOnce).to.be.true;
      expect(Activity.findById.calledWith(mockActivity._id.toString())).to.be.true;
    });

    it('should return null if activity not found', async () => {
      // Modify the stub to return null
      Activity.findById.resolves(null);

      const result = await activityService.getActivityById(mockActivity._id.toString());

      expect(result).to.be.null;
      expect(Activity.findById.calledOnce).to.be.true;
    });

    it('should handle and throw database errors', async () => {
      // Make findById throw an error
      Activity.findById.rejects(new Error('Database error'));

      try {
        await activityService.getActivityById(mockActivity._id.toString());
        // If we get here, the test should fail
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error).to.exist;
        expect(error.message).to.equal('Database error');
      }
    });
  });

  describe('getAllActivities', () => {
    it('should retrieve all activities with pagination', async () => {
      const options = {
        page: 1,
        limit: 10,
        sort: '-createdAt'
      };

      const result = await activityService.getAllActivities(options);

      expect(result).to.exist;
      expect(result.activities).to.be.an('array');
      expect(result.activities.length).to.equal(1);
      expect(result.totalActivities).to.equal(1);
      expect(result.totalPages).to.equal(1);
      expect(result.currentPage).to.equal(1);
      expect(Activity.find.calledOnce).to.be.true;
      expect(Activity.countDocuments.calledOnce).to.be.true;
    });

    it('should apply filters when provided', async () => {
      const filters = {
        destination: mockDestination._id.toString(),
        category: 'Adventure',
        priceMin: 50,
        priceMax: 150,
        difficulty: 'Moderate'
      };

      const options = {
        page: 1,
        limit: 10,
        sort: '-createdAt',
        filters
      };

      const result = await activityService.getAllActivities(options);

      expect(result).to.exist;
      expect(result.activities).to.be.an('array');
      expect(Activity.find.calledOnce).to.be.true;
      expect(Activity.countDocuments.calledOnce).to.be.true;
    });

    it('should handle and throw database errors', async () => {
      // Make find throw an error
      Activity.find.throws(new Error('Database error'));

      try {
        await activityService.getAllActivities({ page: 1, limit: 10 });
        // If we get here, the test should fail
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error).to.exist;
        expect(error.message).to.equal('Database error');
      }
    });
  });

  describe('createActivity', () => {
    it('should create a new activity', async () => {
      const activityData = {
        name: 'New Activity',
        description: 'A brand new activity',
        destination: mockDestination._id.toString(),
        category: 'Sightseeing',
        duration: 2,
        price: 75,
        currency: 'USD',
        difficulty: 'Easy',
        groupSize: { min: 1, max: 8 },
        includes: ['Guide'],
        excludes: ['Equipment'],
        images: ['new-image.jpg'],
        location: {
          coordinates: [41.8781, -87.6298],
          address: '123 New St'
        },
        availableDates: [
          {
            date: new Date(),
            slots: 8,
            booked: 0
          }
        ]
      };

      const result = await activityService.createActivity(activityData);

      expect(result).to.exist;
      expect(result).to.deep.equal(mockActivity);
      expect(Activity.create.calledOnce).to.be.true;
      expect(Activity.create.calledWith(activityData)).to.be.true;
    });

    it('should handle and throw validation errors', async () => {
      // Make create throw a validation error
      const validationError = new mongoose.Error.ValidationError();
      validationError.errors = { name: { message: 'Name is required' } };
      Activity.create.throws(validationError);

      const activityData = {
        // Missing required fields
        category: 'Sightseeing',
        price: 75
      };

      try {
        await activityService.createActivity(activityData);
        // If we get here, the test should fail
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error).to.exist;
        expect(error).to.be.an.instanceof(mongoose.Error.ValidationError);
        expect(error.errors).to.have.property('name');
      }
    });

    it('should handle and throw database errors', async () => {
      // Make create throw a general error
      Activity.create.throws(new Error('Database error'));

      try {
        await activityService.createActivity({ name: 'New Activity' });
        // If we get here, the test should fail
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error).to.exist;
        expect(error.message).to.equal('Database error');
      }
    });
  });

  describe('updateActivity', () => {
    it('should update an existing activity', async () => {
      const activityId = mockActivity._id.toString();
      const updateData = {
        name: 'Updated Activity',
        description: 'Updated description',
        price: 120
      };

      const result = await activityService.updateActivity(activityId, updateData);

      expect(result).to.exist;
      expect(result).to.deep.equal(mockActivity);
      expect(Activity.findByIdAndUpdate.calledOnce).to.be.true;
      expect(Activity.findByIdAndUpdate.firstCall.args[0]).to.equal(activityId);
      expect(Activity.findByIdAndUpdate.firstCall.args[1]).to.deep.equal(updateData);
    });

    it('should return null if activity not found', async () => {
      // Modify the stub to return null
      Activity.findByIdAndUpdate.resolves(null);

      const result = await activityService.updateActivity(
        mockActivity._id.toString(),
        { name: 'Updated Activity' }
      );

      expect(result).to.be.null;
      expect(Activity.findByIdAndUpdate.calledOnce).to.be.true;
    });

    it('should handle and throw database errors', async () => {
      // Make findByIdAndUpdate throw an error
      Activity.findByIdAndUpdate.throws(new Error('Database error'));

      try {
        await activityService.updateActivity(
          mockActivity._id.toString(),
          { name: 'Updated Activity' }
        );
        // If we get here, the test should fail
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error).to.exist;
        expect(error.message).to.equal('Database error');
      }
    });
  });

  describe('deleteActivity', () => {
    it('should delete an activity', async () => {
      const activityId = mockActivity._id.toString();

      const result = await activityService.deleteActivity(activityId);

      expect(result).to.exist;
      expect(result).to.deep.equal(mockActivity);
      expect(Activity.findByIdAndDelete.calledOnce).to.be.true;
      expect(Activity.findByIdAndDelete.calledWith(activityId)).to.be.true;
    });

    it('should return null if activity not found', async () => {
      // Modify the stub to return null
      Activity.findByIdAndDelete.resolves(null);

      const result = await activityService.deleteActivity(mockActivity._id.toString());

      expect(result).to.be.null;
      expect(Activity.findByIdAndDelete.calledOnce).to.be.true;
    });

    it('should handle and throw database errors', async () => {
      // Make findByIdAndDelete throw an error
      Activity.findByIdAndDelete.throws(new Error('Database error'));

      try {
        await activityService.deleteActivity(mockActivity._id.toString());
        // If we get here, the test should fail
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error).to.exist;
        expect(error.message).to.equal('Database error');
      }
    });
  });

  describe('bookActivity', () => {
    it('should book an activity and update available slots', async () => {
      const bookingData = {
        activity: mockActivity._id.toString(),
        user: mockUser._id.toString(),
        date: new Date(),
        participants: 2
      };

      // Additional stub for the update operation
      const activityWithUpdatedSlots = {
        ...mockActivity,
        availableDates: [
          {
            date: bookingData.date,
            slots: 10,
            booked: 2
          }
        ]
      };
      Activity.findByIdAndUpdate.resolves(activityWithUpdatedSlots);

      const result = await activityService.bookActivity(bookingData);

      expect(result).to.exist;
      expect(result.booking).to.deep.equal(mockBooking);
      expect(result.updatedActivity).to.deep.equal(activityWithUpdatedSlots);
      expect(Booking.create.calledOnce).to.be.true;
      expect(Activity.findByIdAndUpdate.calledOnce).to.be.true;
    });

    it('should throw an error if activity is not found', async () => {
      // Modify the findById stub to return null
      Activity.findById.resolves(null);

      try {
        await activityService.bookActivity({
          activity: mockActivity._id.toString(),
          user: mockUser._id.toString(),
          date: new Date(),
          participants: 2
        });
        // If we get here, the test should fail
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error).to.exist;
        expect(error.message).to.include('not found');
      }
    });

    it('should throw an error if booking date is not available', async () => {
      // Create a mock activity with no available dates
      const activityWithNoAvailableDates = {
        ...mockActivity,
        availableDates: []
      };
      Activity.findById.resolves(activityWithNoAvailableDates);

      try {
        await activityService.bookActivity({
          activity: mockActivity._id.toString(),
          user: mockUser._id.toString(),
          date: new Date(),
          participants: 2
        });
        // If we get here, the test should fail
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error).to.exist;
        expect(error.message).to.include('not available');
      }
    });

    it('should throw an error if not enough available slots', async () => {
      // Create a mock activity with insufficient slots
      const activityWithInsufficientSlots = {
        ...mockActivity,
        availableDates: [
          {
            date: new Date(),
            slots: 10,
            booked: 9
          }
        ]
      };
      Activity.findById.resolves(activityWithInsufficientSlots);

      try {
        await activityService.bookActivity({
          activity: mockActivity._id.toString(),
          user: mockUser._id.toString(),
          date: new Date(),
          participants: 2
        });
        // If we get here, the test should fail
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error).to.exist;
        expect(error.message).to.include('not enough slots');
      }
    });
  });

  describe('addReviewToActivity', () => {
    it('should add a review and update activity rating', async () => {
      const reviewData = {
        activity: mockActivity._id.toString(),
        user: mockUser._id.toString(),
        rating: 5,
        comment: 'Excellent experience!'
      };

      // Additional stubs for the update operation
      Review.find.resolves([{ rating: 4 }, { rating: 5 }]); // Mock existing reviews
      const updatedActivity = {
        ...mockActivity,
        rating: 4.5 // New rating
      };
      Activity.findByIdAndUpdate.resolves(updatedActivity);

      const result = await activityService.addReviewToActivity(reviewData);

      expect(result).to.exist;
      expect(result.review).to.deep.equal(mockReview);
      expect(result.updatedActivity).to.deep.equal(updatedActivity);
      expect(Review.create.calledOnce).to.be.true;
      expect(Activity.findByIdAndUpdate.calledOnce).to.be.true;
    });

    it('should throw an error if activity is not found', async () => {
      // Modify the findById stub to return null
      Activity.findById.resolves(null);

      try {
        await activityService.addReviewToActivity({
          activity: mockActivity._id.toString(),
          user: mockUser._id.toString(),
          rating: 5,
          comment: 'Great activity!'
        });
        // If we get here, the test should fail
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error).to.exist;
        expect(error.message).to.include('not found');
      }
    });

    it('should handle and throw database errors', async () => {
      // Make create throw an error
      Review.create.throws(new Error('Database error'));

      try {
        await activityService.addReviewToActivity({
          activity: mockActivity._id.toString(),
          user: mockUser._id.toString(),
          rating: 5,
          comment: 'Great activity!'
        });
        // If we get here, the test should fail
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error).to.exist;
        expect(error.message).to.equal('Database error');
      }
    });
  });
}); 