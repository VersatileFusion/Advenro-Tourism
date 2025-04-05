/**
 * Authentication Controller
 * Handles authentication-related requests
 */
const AuthService = require('../services/AuthService');
const authService = new AuthService();

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    
    // In production, add validation and check if user exists
    // Mock user creation
    const user = {
      id: `user_${Date.now()}`,
      email,
      name,
      role: 'user',
      createdAt: new Date()
    };
    
    // Generate token
    const token = authService.generateToken(user);
    const refreshToken = authService.generateRefreshToken(user);
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login an existing user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // In production, validate credentials against database
    // Mock user for now
    const user = {
      id: 'user_123',
      email,
      name: 'Demo User',
      role: 'user'
    };
    
    // Generate token
    const token = authService.generateToken(user);
    const refreshToken = authService.generateRefreshToken(user);
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      // Invalidate refresh token
      authService.invalidateRefreshToken(refreshToken);
    }
    
    res.status(200).json({
      success: true,
      message: 'Successfully logged out'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      const error = new Error('Refresh token is required');
      error.status = 400;
      error.code = 'REFRESH_TOKEN_REQUIRED';
      throw error;
    }
    
    // Verify refresh token
    const userData = await authService.verifyRefreshToken(refreshToken);
    if (!userData) {
      const error = new Error('Invalid or expired refresh token');
      error.status = 401;
      error.code = 'INVALID_REFRESH_TOKEN';
      throw error;
    }
    
    // Mock user lookup in production
    const user = {
      id: userData.id,
      email: 'user@example.com',
      name: 'Demo User',
      role: 'user'
    };
    
    // Generate new tokens
    const token = authService.generateToken(user);
    const newRefreshToken = authService.generateRefreshToken(user);
    
    // Invalidate old refresh token
    authService.invalidateRefreshToken(refreshToken);
    
    res.status(200).json({
      success: true,
      data: {
        token,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // In production, check if email exists and send reset link
    
    res.status(200).json({
      success: true,
      message: 'Password reset instructions sent to your email'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    
    // In production, verify token and update password
    
    res.status(200).json({
      success: true,
      message: 'Password successfully reset'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getProfile = async (req, res, next) => {
  try {
    // User is already attached to request by auth middleware
    const { user } = req;
    
    // In production, fetch full user profile from database
    
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: 'Demo User',
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
}; 