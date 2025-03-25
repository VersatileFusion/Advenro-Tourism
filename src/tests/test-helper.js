const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const chai = require('chai');
const request = require('supertest');
const express = require('express');
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Flight = require('../models/Flight');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const app = require('../app');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Database connection helpers
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI_TEST, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    console.error('Test database connection error:', error);
    process.exit(1);
  }
};

const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
};

// User helpers
const createTestUser = async (userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    role: 'user',
    ...userData
  };

  const user = new User(defaultUser);
  await user.save();
  return user;
};

const createTestAdmin = async (adminData = {}) => {
  const defaultAdmin = {
    name: 'Test Admin',
    email: `admin${Date.now()}@example.com`,
    password: 'admin123',
    role: 'admin',
    ...adminData
  };

  const admin = new User(defaultAdmin);
  await admin.save();
  return admin;
};

const generateTestToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Hotel helpers
const createTestHotel = async (hotelData = {}) => {
  const defaultHotel = {
    name: 'Test Hotel',
    location: 'Test Location',
    description: 'Test Description',
    price: 100,
    rating: 4.5,
    amenities: ['WiFi', 'Pool'],
    images: ['test-image.jpg'],
    ...hotelData
  };

  const hotel = new Hotel(defaultHotel);
  await hotel.save();
  return hotel;
};

// Booking helpers
const createTestBooking = async (bookingData = {}) => {
  const user = bookingData.user || await createTestUser();
  const hotel = bookingData.hotel || await createTestHotel();
  
  const defaultBooking = {
    user: user._id,
    hotel: hotel._id,
    checkIn: new Date(),
    checkOut: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    guests: 2,
    totalPrice: 700,
    status: 'pending',
    ...bookingData
  };

  const booking = new Booking(defaultBooking);
  await booking.save();
  return booking;
};

// Review helpers
const createTestReview = async (reviewData = {}) => {
  const user = reviewData.user || await createTestUser();
  const hotel = reviewData.hotel || await createTestHotel();
  
  const defaultReview = {
    user: user._id,
    hotel: hotel._id,
    rating: 5,
    comment: 'Great experience!',
    ...reviewData
  };

  const review = new Review(defaultReview);
  await review.save();
  return review;
};

// Flight helpers
const createTestFlight = async (flightData = {}) => {
  const defaultFlight = {
    airline: 'Test Airlines',
    flightNumber: 'TA123',
    departure: 'Test City',
    arrival: 'Destination City',
    departureTime: new Date(),
    arrivalTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours later
    price: 200,
    seats: 100,
    ...flightData
  };

  const flight = new Flight(defaultFlight);
  await flight.save();
  return flight;
};

// Configure Chai
chai.use(function(chai, utils) {
  chai.Assertion.addProperty('toBeDefined', function() {
    this.assert(
      this._obj !== undefined,
      'expected #{this} to be defined',
      'expected #{this} to be undefined'
    );
  });

  chai.Assertion.addProperty('toBeNull', function() {
    this.assert(
      this._obj === null,
      'expected #{this} to be null',
      'expected #{this} to not be null'
    );
  });

  chai.Assertion.addProperty('toBeTruthy', function() {
    this.assert(
      Boolean(this._obj),
      'expected #{this} to be truthy',
      'expected #{this} to be falsy'
    );
  });

  chai.Assertion.addProperty('toBeFalsy', function() {
    this.assert(
      !Boolean(this._obj),
      'expected #{this} to be falsy',
      'expected #{this} to be truthy'
    );
  });
});

module.exports = {
  app,
  connectDB,
  clearDatabase,
  createTestUser,
  createTestAdmin,
  createTestHotel,
  createTestBooking,
  createTestReview,
  createTestFlight,
  generateTestToken
}; 