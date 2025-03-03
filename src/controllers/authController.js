const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        console.log('📝 Starting user registration process...');
        const { name, email, password } = req.body;
        
        console.log(`🔍 Checking if email ${email} already exists...`);
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('❌ Email already registered');
            return res.status(400).json({
                success: false,
                error: 'Email already registered'
            });
        }

        console.log('👤 Creating new user...');
        // Create user
        const user = await User.create({
            name,
            email,
            password
        });

        console.log(`✅ User created successfully with ID: ${user._id}`);
        sendTokenResponse(user, 201, res);
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        console.log('🔐 Starting login process...');
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            console.log('❌ Missing email or password');
            return res.status(400).json({
                success: false,
                error: 'Please provide an email and password'
            });
        }

        console.log(`🔍 Finding user with email: ${email}`);
        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            console.log('❌ User not found');
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        console.log('🔐 Checking password...');
        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            console.log('❌ Invalid password');
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        console.log(`✅ Login successful for user: ${user._id}`);
        sendTokenResponse(user, 200, res);
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        console.log(`🔍 Getting profile for user: ${req.user.id}`);
        const user = await User.findById(req.user.id);
        console.log('✅ User profile retrieved successfully');
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('❌ Error getting user profile:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    console.log('🎟️ Generating JWT token...');
    // Create token
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    console.log('🍪 Setting cookie and sending response...');
    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token
        });
}; 