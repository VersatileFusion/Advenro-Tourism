const { User } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs').promises;

// Get all users (admin only)
exports.getAllUsers = catchAsync(async (req, res) => {
    const users = await User.find().select('-password');

    res.status(200).json({
        status: 'success',
        results: users.length,
        data: { users }
    });
});

// Get user statistics (admin only)
exports.getUserStats = catchAsync(async (req, res) => {
    const stats = await User.aggregate([
        {
            $group: {
                _id: '$role',
                count: { $sum: 1 },
                users: { $push: { id: '$_id', name: '$name', email: '$email' } }
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: { stats }
    });
});

// Get user by ID (admin only)
exports.getUserById = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { user }
    });
});

// Update user (admin only)
exports.updateUser = catchAsync(async (req, res, next) => {
    // Prevent password update through this route
    if (req.body.password) {
        return next(new AppError('This route is not for password updates. Please use /updatePassword', 400));
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    ).select('-password');

    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { user }
    });
});

// Delete user (admin only)
exports.deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Get current user profile
exports.getProfile = catchAsync(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({
        success: true,
        data: user
    });
});

// Update user profile
exports.updateProfile = catchAsync(async (req, res, next) => {
    const { name, phone, address } = req.body;
    
    // Validate phone number if provided
    if (phone && !/^\+?[\d\s-]+$/.test(phone)) {
        return next(new AppError('Invalid phone number format', 400));
    }

    const user = await User.findByIdAndUpdate(
        req.user.id,
        { name, phone, address },
        { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
        success: true,
        data: user
    });
});

// Update email
exports.updateEmail = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // Check current password
    const user = await User.findById(req.user.id).select('+password');
    if (!(await user.comparePassword(password))) {
        return next(new AppError('Current password is incorrect', 401));
    }

    // Generate verification token
    const verificationToken = user.getEmailVerificationToken();
    user.email = email;
    user.emailVerified = false;
    await user.save();

    // TODO: Send verification email
    
    res.status(200).json({
        success: true,
        data: 'Email verification sent'
    });
});

// Update password
exports.updatePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    // Check password requirements
    if (newPassword.length < 8) {
        return next(new AppError('Password must be at least 8 characters', 400));
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.comparePassword(currentPassword))) {
        return next(new AppError('Current password is incorrect', 401));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = user.getSignedJwtToken();

    res.status(200).json({
        success: true,
        token
    });
});

// Setup 2FA
exports.setup2FA = catchAsync(async (req, res) => {
    const secret = speakeasy.generateSecret();
    const otpauthUrl = speakeasy.otpauthURL({
        secret: secret.base32,
        label: `Tourism App:${req.user.email}`,
        issuer: 'Tourism App'
    });

    // Store the secret temporarily
    const user = await User.findById(req.user.id);
    user.twoFactorSecret = secret.base32;
    await user.save();

    const qrCode = await qrcode.toDataURL(otpauthUrl);

    res.status(200).json({
        success: true,
        data: {
            secret: secret.base32,
            qrCode
        }
    });
});

// Enable 2FA
exports.enable2FA = catchAsync(async (req, res, next) => {
    const { token } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.twoFactorSecret) {
        return next(new AppError('Please setup 2FA first', 400));
    }

    // Verify token
    const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token.toString(),
        window: 1 // Allow 30 seconds clock skew
    });

    if (!verified) {
        return next(new AppError('Invalid authentication code', 400));
    }

    user.twoFactorEnabled = true;
    await user.save();

    res.status(200).json({
        success: true,
        message: '2FA enabled successfully'
    });
});

// Update avatar
exports.updateAvatar = catchAsync(async (req, res, next) => {
    if (!req.files || !req.files.avatar) {
        return next(new AppError('Please upload an image file', 400));
    }

    const file = req.files.avatar;

    // Check if it's an image
    if (!file.mimetype.startsWith('image')) {
        return next(new AppError('Please upload an image file', 400));
    }

    // Check file size
    if (file.size > 5 * 1024 * 1024) {
        return next(new AppError('Image size should be less than 5MB', 400));
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../public/uploads/avatars');
    try {
        await fs.access(uploadDir);
    } catch {
        await fs.mkdir(uploadDir, { recursive: true });
    }

    // Create filename
    const filename = `avatar_${req.user.id}_${Date.now()}${path.extname(file.name)}`;
    const uploadPath = path.join(uploadDir, filename);

    try {
        // Process and save image
        await sharp(file.tempFilePath)
            .resize(200, 200, {
                fit: 'cover',
                position: 'center'
            })
            .toFile(uploadPath);

        // Delete the temp file
        await fs.unlink(file.tempFilePath);

        // Delete old avatar if it exists
        const user = await User.findById(req.user.id);
        if (user.avatar && user.avatar !== 'default-avatar.jpg') {
            const oldAvatarPath = path.join(uploadDir, user.avatar);
            try {
                await fs.access(oldAvatarPath);
                await fs.unlink(oldAvatarPath);
            } catch (err) {
                // Ignore error if old avatar doesn't exist
            }
        }

        // Update user avatar in database
        user.avatar = filename;
        await user.save();

        res.status(200).json({
            success: true,
            data: filename
        });
    } catch (err) {
        // Clean up temp file if it exists
        if (file.tempFilePath) {
            try {
                await fs.unlink(file.tempFilePath);
            } catch {
                // Ignore error
            }
        }
        return next(new AppError('Error processing image', 500));
    }
}); 