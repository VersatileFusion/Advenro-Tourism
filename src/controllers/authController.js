const { User } = require('../models');
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

// @desc    Protect routes
// @middleware
exports.protect = async (req, res, next) => {
    try {
        console.log('🔒 Protecting route - checking authentication...');
        let token;

        // Check if auth header exists and starts with Bearer
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            console.log('❌ No token provided');
            return res.status(401).json({
                success: false,
                error: 'Not authorized to access this route'
            });
        }

        try {
            // Verify token
            console.log('🔍 Verifying JWT token...');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Add user to request
            console.log(`✅ Token verified for user: ${decoded.id}`);
            req.user = await User.findById(decoded.id);
            next();
        } catch (error) {
            console.error('❌ Token verification failed:', error);
            return res.status(401).json({
                success: false,
                error: 'Not authorized to access this route'
            });
        }
    } catch (error) {
        console.error('❌ Authentication error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

// @desc    Restrict to certain roles
// @middleware
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        console.log(`🔒 Checking role permission. User role: ${req.user.role}, Required roles: ${roles.join(', ')}`);
        if (!roles.includes(req.user.role)) {
            console.log('❌ User does not have required role');
            return res.status(403).json({
                success: false,
                error: 'Not authorized to perform this action'
            });
        }
        console.log('✅ Role permission granted');
        next();
    };
};

// Helper function to send token response
const sendTokenResponse = (user, statusCode, res) => {
    console.log('🔑 Generating JWT token...');
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