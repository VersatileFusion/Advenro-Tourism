const mongoose = require('mongoose');
const User = require('../../src/server/models/user');
const Hotel = require('../../src/server/models/Hotel');
const Destination = require('../../src/server/models/Destination');
const Booking = require('../../src/server/models/booking');
const Review = require('../../src/server/models/Review');

/**
 * Database helper utilities for testing
 */
const dbHelper = {
  /**
   * Clear all collections in the database
   */
  async clearDatabase() {
    const collections = Object.keys(mongoose.connection.collections);
    
    for (const collectionName of collections) {
      const collection = mongoose.connection.collections[collectionName];
      await collection.deleteMany({});
    }
  },

  /**
   * Create a test user with specified role
   * @param {Object} userData - User data to create
   * @param {String} userData.role - User role (default: 'user')
   * @returns {Object} Created user document
   */
  async createUser(userData = {}) {
    const defaultUserData = {
      name: `Test User ${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      role: 'user',
      isVerified: true,
      firstName: 'Test',
      lastName: 'User'
    };

    return User.create({ ...defaultUserData, ...userData });
  },

  /**
   * Create a test hotel
   * @param {Object} hotelData - Hotel data to create
   * @returns {Object} Created hotel document
   */
  async createHotel(hotelData = {}) {
    const defaultHotelData = {
      name: `Test Hotel ${Date.now()}`,
      location: 'Test Location',
      description: 'A test hotel for testing purposes',
      pricePerNight: 100,
      amenities: ['WiFi', 'Breakfast'],
      rating: 4.0,
      imageUrl: 'https://example.com/test-hotel.jpg'
    };

    return Hotel.create({ ...defaultHotelData, ...hotelData });
  },

  /**
   * Create a test destination
   * @param {Object} destinationData - Destination data to create
   * @returns {Object} Created destination document
   */
  async createDestination(destinationData = {}) {
    const defaultDestinationData = {
      name: `Test Destination ${Date.now()}`,
      country: 'Test Country',
      description: 'A test destination for testing purposes',
      imageUrl: 'https://example.com/test-destination.jpg'
    };

    return Destination.create({ ...defaultDestinationData, ...destinationData });
  },

  /**
   * Create a test reservation
   * @param {Object} reservationData - Reservation data
   * @param {Object} reservationData.user - User document or ID
   * @param {Object} reservationData.hotel - Hotel document or ID
   * @returns {Object} Created reservation document
   */
  async createReservation(reservationData = {}) {
    if (!reservationData.user) {
      const user = await this.createUser();
      reservationData.user = user._id;
    }

    if (!reservationData.hotel) {
      const hotel = await this.createHotel();
      reservationData.hotel = hotel._id;
    }

    const defaultReservationData = {
      checkInDate: new Date(Date.now() + 86400000), // Tomorrow
      checkOutDate: new Date(Date.now() + 86400000 * 5), // 5 days from tomorrow
      totalPrice: 400,
      status: 'confirmed',
      paymentStatus: 'paid'
    };

    return Booking.create({ ...defaultReservationData, ...reservationData });
  },
  
  /**
   * Create a test review
   * @param {Object} reviewData - Review data
   * @param {Object} reviewData.user - User document or ID 
   * @param {Object} reviewData.hotel - Hotel document or ID
   * @returns {Object} Created review document
   */
  async createReview(reviewData = {}) {
    if (!reviewData.user) {
      const user = await this.createUser();
      reviewData.user = user._id;
    }

    if (!reviewData.hotel) {
      const hotel = await this.createHotel();
      reviewData.hotel = hotel._id;
    }

    const defaultReviewData = {
      rating: 4,
      comment: 'This is a test review comment',
      date: new Date()
    };

    return Review.create({ ...defaultReviewData, ...reviewData });
  },
  
  /**
   * Populate database with sample data for integration testing
   */
  async populateSampleData() {
    // Create users
    const admin = await this.createUser({ 
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin' 
    });
    
    const regularUser = await this.createUser({
      name: 'Regular User',
      email: 'user@example.com'
    });
    
    // Create destinations
    const paris = await this.createDestination({
      name: 'Paris',
      country: 'France',
      description: 'The city of love and lights'
    });
    
    const rome = await this.createDestination({
      name: 'Rome',
      country: 'Italy',
      description: 'Ancient city with rich history'
    });
    
    // Create hotels
    const luxuryHotel = await this.createHotel({
      name: 'Luxury Palace',
      location: 'Paris, France',
      description: 'A luxury hotel in the heart of Paris',
      pricePerNight: 300,
      amenities: ['Pool', 'Spa', 'WiFi', 'Restaurant'],
      rating: 4.8
    });
    
    const budgetHotel = await this.createHotel({
      name: 'Budget Stay',
      location: 'Rome, Italy',
      description: 'Affordable accommodation in Rome',
      pricePerNight: 80,
      amenities: ['WiFi', 'Breakfast'],
      rating: 3.5
    });
    
    // Create reservations
    await this.createReservation({
      user: regularUser._id,
      hotel: luxuryHotel._id,
      totalPrice: 1200
    });
    
    // Create reviews
    await this.createReview({
      user: regularUser._id,
      hotel: luxuryHotel._id,
      rating: 5,
      comment: 'Amazing stay! Would definitely come back.'
    });
    
    return {
      users: { admin, regularUser },
      destinations: { paris, rome },
      hotels: { luxuryHotel, budgetHotel }
    };
  }
};

module.exports = dbHelper; 