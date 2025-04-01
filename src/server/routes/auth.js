const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const validator = require('validator');
const { authenticate } = require('../middleware/auth');

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', async (req, res) => {
  try {
    console.log('Register route hit with body:', req.body);
    const { email, password, name, firstName, lastName } = req.body;
    
    // Set up user names based on what fields are provided
    let userFirstName = firstName;
    let userLastName = lastName;
    let userName = name;
    
    // If firstName and lastName are not provided but name is, split the name
    if (!firstName && !lastName && name) {
      const nameParts = name.split(' ');
      if (nameParts.length > 1) {
        userFirstName = nameParts[0];
        userLastName = nameParts.slice(1).join(' ');
      } else {
        userFirstName = name;
        userLastName = '';
      }
    }
    
    // If name is not provided but firstName and lastName are, create a full name
    if (!name && firstName && lastName) {
      userName = `${firstName} ${lastName}`;
    }
    
    // Validate email format
    console.log('Validating email format');
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    
    // Check if user already exists
    console.log('Checking if user exists');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    // Create new user - no need to hash password here, the model's pre-save hook will do it
    console.log('Creating new user');
    const user = new User({
      email,
      password, // Don't hash here - let the model's pre-save middleware handle it
      name: userName || `${userFirstName} ${userLastName}`.trim(),
      firstName: userFirstName,
      lastName: userLastName
    });
    
    console.log('Saving user');
    await user.save();
    console.log('User saved with ID:', user._id);
    
    // Generate JWT token
    console.log('Generating token');
    const token = user.generateAuthToken();
    
    // Return user data and token
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Error in register route:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Authenticate user & get token
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    console.log('Login route hit with body:', req.body);
    const { email, password } = req.body;
    
    // Find user by email
    console.log('Finding user by email:', email);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log('User found with ID:', user._id);
    
    // Check password - use the model's method
    console.log('Comparing password');
    const isMatch = await user.comparePassword(password);
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    console.log('Generating token');
    const token = user.generateAuthToken();
    
    // Return user data and token
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Error in login route:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      // In a real application, you would:
      // 1. Generate a password reset token
      // 2. Save it to the user document
      // 3. Send an email with the reset link
      // For testing, we'll just return success
    }

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error processing request' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    // In a real application, you would:
    // 1. Verify the token
    // 2. Find the user by token
    // 3. Hash the new password
    // 4. Update the user's password
    // For testing, we'll just return success

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password' });
  }
});

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    console.log('Profile route hit for user:', req.user._id);
    
    // User is already attached to req by the authenticate middleware
    // Return user data without sensitive information
    res.json({
      success: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Error in profile route:', error);
    res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user (token handled on client side)
 * @access Private
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    console.log('Logout route hit for user:', req.user._id);
    
    // In a simple JWT implementation, the token is stateless and handled client-side
    // The client will delete the token from local storage
    // For a more secure implementation, you could use token blacklisting
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Error in logout route:', error);
    res.status(500).json({ success: false, message: 'Error during logout' });
  }
});

module.exports = router; 