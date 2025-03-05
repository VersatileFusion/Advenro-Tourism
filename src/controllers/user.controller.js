const { User } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

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