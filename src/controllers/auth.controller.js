const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const { User } = require('../models');
const { sendEmail } = require('../utils/email');

// Register new user
exports.register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, subscribeNewsletter } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Create new user
        user = new User({
            firstName,
            lastName,
            email,
            password,
            subscribeNewsletter
        });

        // Save user to database
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                subscribeNewsletter: user.subscribeNewsletter
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                subscribeNewsletter: user.subscribeNewsletter
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate reset token
        const resetToken = user.getResetPasswordToken();
        await user.save();

        // Send email
        const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
        await sendEmail({
            email: user.email,
            subject: 'Password Reset',
            message: `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`
        });

        res.json({
            success: true,
            message: 'Email sent'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Reset password
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        // Find user by reset token
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid token'
            });
        }

        // Set new password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, email },
            { new: true }
        );

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update user settings
exports.updateSettings = async (req, res) => {
    try {
        const { notifications, language, theme } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { 
                settings: {
                    notifications,
                    language,
                    theme
                }
            },
            { new: true }
        );

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Google authentication
exports.googleAuth = async (req, res) => {
    try {
        const { idToken } = req.body;
        
        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: 'ID token is required'
            });
        }

        // In a real implementation, you would:
        // 1. Verify the Google ID token using Google API client library
        // 2. Extract user information from the token payload
        // 3. Create or update the user in your database

        // For demonstration, we'll create a mock implementation
        const googleUserId = crypto.randomBytes(16).toString('hex'); // In reality, extracted from verified token
        
        // Check if user exists with this Google ID
        let user = await User.findOne({ 'social.google.id': googleUserId });
        
        if (!user) {
            // Mock user data that would come from the Google token
            const userData = {
                email: `google_${googleUserId}@example.com`, // In reality, from token
                firstName: 'Google',
                lastName: 'User',
                profilePicture: 'https://example.com/default-profile.jpg'
            };
            
            // Create new user if not exists
            user = new User({
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                avatar: userData.profilePicture,
                password: crypto.randomBytes(20).toString('hex'), // Random password for social users
                social: {
                    google: {
                        id: googleUserId,
                        token: idToken
                    }
                }
            });
            
            await user.save();
        } else {
            // Update the token
            user.social.google.token = idToken;
            await user.save();
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Facebook authentication
exports.facebookAuth = async (req, res) => {
    try {
        const { accessToken } = req.body;
        
        if (!accessToken) {
            return res.status(400).json({
                success: false,
                message: 'Access token is required'
            });
        }

        // In a real implementation, you would:
        // 1. Verify the Facebook access token with Facebook Graph API
        // 2. Get user profile information from Facebook
        // 3. Create or update the user in your database

        // For demonstration, we'll create a mock implementation
        const facebookUserId = crypto.randomBytes(16).toString('hex'); // In reality, from FB API response
        
        // Check if user exists with this Facebook ID
        let user = await User.findOne({ 'social.facebook.id': facebookUserId });
        
        if (!user) {
            // Mock user data that would come from the Facebook API
            const userData = {
                email: `facebook_${facebookUserId}@example.com`, // In reality, from FB API
                firstName: 'Facebook',
                lastName: 'User',
                profilePicture: 'https://example.com/default-profile.jpg'
            };
            
            // Create new user if not exists
            user = new User({
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                avatar: userData.profilePicture,
                password: crypto.randomBytes(20).toString('hex'), // Random password for social users
                social: {
                    facebook: {
                        id: facebookUserId,
                        token: accessToken
                    }
                }
            });
            
            await user.save();
        } else {
            // Update the token
            user.social.facebook.token = accessToken;
            await user.save();
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Facebook auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Delete user account
exports.deleteAccount = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user.id);
        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update user avatar
exports.updateAvatar = async (req, res) => {
    try {
        const { avatar } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { avatar },
            { new: true }
        );

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Update avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Apple authentication
exports.appleAuth = async (req, res) => {
    try {
        const { identityToken } = req.body;

        if (!identityToken) {
            return res.status(400).json({
                success: false,
                message: 'Identity token is required'
            });
        }

        // In a real implementation, you would:
        // 1. Verify the Apple identity token
        // 2. Extract user information from the token
        // 3. Create or update the user in your database

        // For demonstration, we'll create a mock implementation
        const appleUserId = crypto.randomBytes(16).toString('hex'); // Simulate Apple user ID extraction
        
        // Check if user exists with this Apple ID
        let user = await User.findOne({ 'social.apple.id': appleUserId });
        
        if (!user) {
            // Create new user if not exists
            const email = `apple_${appleUserId}@example.com`; // In reality, extract from token
            user = new User({
                firstName: 'Apple',
                lastName: 'User',
                email,
                password: crypto.randomBytes(20).toString('hex'),
                social: {
                    apple: {
                        id: appleUserId,
                        token: identityToken
                    }
                }
            });
            
            await user.save();
        } else {
            // Update the token
            user.social.apple.token = identityToken;
            await user.save();
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Apple auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Refresh token
exports.refreshToken = async (req, res) => {
    try {
        // Get user from middleware
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        // Generate new JWT token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get active sessions
exports.getSessions = async (req, res) => {
    try {
        // In a real implementation, you would:
        // 1. Query a sessions collection that tracks user sessions
        // 2. Return active sessions for the current user
        
        // For demonstration purposes, we'll return mock data
        const mockSessions = [
            {
                id: '1',
                device: 'Chrome on Windows',
                ipAddress: '192.168.1.1',
                lastActive: new Date(),
                isCurrent: true
            },
            {
                id: '2',
                device: 'Mobile App on Android',
                ipAddress: '192.168.1.2', 
                lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                isCurrent: false
            }
        ];
        
        res.json({
            success: true,
            sessions: mockSessions
        });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            success: false, 
            message: 'Server error'
        });
    }
};

// Terminate session
exports.terminateSession = async (req, res) => {
    try {
        const { id } = req.params;
        
        // In a real implementation, you would:
        // 1. Find the session in your sessions collection
        // 2. Verify the session belongs to the current user
        // 3. Invalidate/remove the session

        // For demonstration purposes, we'll just return success
        res.json({
            success: true,
            message: 'Session terminated'
        });
    } catch (error) {
        console.error('Terminate session error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
}; 