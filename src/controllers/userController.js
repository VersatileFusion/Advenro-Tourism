const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const path = require('path');

// @desc    Get current user profile
// @route   GET /api/v1/users/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).populate('bookings');
    res.status(200).json({ success: true, data: user });
});

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
    const fieldsToUpdate = {
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address,
        preferences: req.body.preferences
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
        fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(
        req.user.id,
        fieldsToUpdate,
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({ success: true, data: user });
});

// @desc    Update user email
// @route   PUT /api/v1/users/email
// @access  Private
exports.updateEmail = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorResponse('Please provide email and password', 400));
    }

    // Check current password
    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return next(new ErrorResponse('Password is incorrect', 401));
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
        return next(new ErrorResponse('Email already exists', 400));
    }

    user.email = email;
    user.emailVerified = false;
    await user.save();

    // Get verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Create verification url
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/users/verifyemail/${verificationToken}`;

    const message = `Please click on the link to verify your email: \n\n ${verificationUrl}`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Email Verification',
            message
        });

        res.status(200).json({ success: true, data: 'Email verification sent' });
    } catch (err) {
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new ErrorResponse('Email could not be sent', 500));
    }
});

// @desc    Verify email
// @route   GET /api/v1/users/verifyemail/:token
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res, next) => {
    // Get hashed token
    const emailVerificationToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        emailVerificationToken,
        emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
        return next(new ErrorResponse('Invalid or expired token', 400));
    }

    // Set new password
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, data: 'Email verified' });
});

// @desc    Update password
// @route   PUT /api/v1/users/password
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return next(new ErrorResponse('Please provide current and new password', 400));
    }

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
        return next(new ErrorResponse('Current password is incorrect', 401));
    }

    user.password = newPassword;
    await user.save();

    // Send token
    sendTokenResponse(user, 200, res);
});

// @desc    Upload avatar
// @route   PUT /api/v1/users/avatar
// @access  Private
exports.uploadAvatar = asyncHandler(async (req, res, next) => {
    if (!req.files) {
        return next(new ErrorResponse('Please upload a file', 400));
    }

    const file = req.files.avatar;

    // Make sure the image is a photo
    if (!file.mimetype.startsWith('image')) {
        return next(new ErrorResponse('Please upload an image file', 400));
    }

    // Check filesize
    if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(
            new ErrorResponse(
                `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
                400
            )
        );
    }

    // Create custom filename
    file.name = `avatar_${req.user.id}${path.parse(file.name).ext}`;

    // Move file to upload path
    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
        if (err) {
            console.error(err);
            return next(new ErrorResponse('Problem with file upload', 500));
        }

        await User.findByIdAndUpdate(req.user.id, { avatar: file.name });

        res.status(200).json({ success: true, data: file.name });
    });
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({ success: true, token });
}; 