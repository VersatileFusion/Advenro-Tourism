const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const auth = require("../middleware/auth");
const {
  register,
  login,
  getProfile,
  updateProfile,
  subscribeNewsletter,
} = require("../controllers/userController");

const {
  getFavorites,
  addFavorite,
  removeFavorite,
} = require("../controllers/userFavoritesController");

const {
  getAllUserBookings,
  getBookingById,
  cancelBooking,
} = require("../controllers/userBookingsController");

// @route   POST api/users/register
// @desc    Register user
// @access  Public
router.post(
  "/register",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  register
);

// @route   POST api/users/login
// @desc    Login user
// @access  Public
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  login
);

// @route   GET api/users/profile
// @desc    Get user profile
// @access  Private
router.get("/profile", auth, getProfile);

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", auth, updateProfile);

// @route   POST api/users/newsletter/subscribe
// @desc    Subscribe to newsletter
// @access  Public
router.post("/newsletter/subscribe", subscribeNewsletter);

// Favorites Routes
// @route   GET api/users/favorites
// @desc    Get user favorites
// @access  Private
router.get("/favorites", auth, getFavorites);

// @route   POST api/users/favorites/:itemType/:itemId
// @desc    Add an item to favorites
// @access  Private
router.post("/favorites/:itemType/:itemId", auth, addFavorite);

// @route   DELETE api/users/favorites/:itemType/:itemId
// @desc    Remove an item from favorites
// @access  Private
router.delete("/favorites/:itemType/:itemId", auth, removeFavorite);

// Bookings Routes
// @route   GET api/users/bookings
// @desc    Get all user bookings across all booking types
// @access  Private
router.get("/bookings", auth, getAllUserBookings);

// @route   GET api/users/bookings/:id
// @desc    Get booking details by ID
// @access  Private
router.get("/bookings/:id", auth, getBookingById);

// @route   PUT api/users/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.put("/bookings/:id/cancel", auth, cancelBooking);

module.exports = router;
