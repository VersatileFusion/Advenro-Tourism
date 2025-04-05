/**
 * Users Controller
 * Handles user-related requests
 */

// Mock users data
const users = [
  {
    id: 'user_123',
    email: 'john.doe@example.com',
    name: 'John Doe',
    avatar: 'https://example.com/avatars/john.jpg',
    bio: 'Travel enthusiast and food lover',
    phone: '+1234567890',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    preferences: {
      language: 'en',
      currency: 'USD',
      notifications: {
        email: true,
        sms: false,
        push: true
      },
      marketing: false,
      theme: 'light'
    },
    role: 'user',
    createdAt: '2023-01-15T10:30:00Z'
  },
  {
    id: 'user_456',
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    avatar: 'https://example.com/avatars/jane.jpg',
    bio: 'Business traveler with a passion for luxury hotels',
    phone: '+9876543210',
    address: {
      street: '456 Park Ave',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94103',
      country: 'USA'
    },
    preferences: {
      language: 'en',
      currency: 'EUR',
      notifications: {
        email: true,
        sms: true,
        push: true
      },
      marketing: true,
      theme: 'dark'
    },
    role: 'user',
    createdAt: '2023-02-20T14:45:00Z'
  }
];

/**
 * Get user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getProfile = async (req, res, next) => {
  try {
    // In a real application, fetch user from database using req.user.id
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }
    
    // Remove sensitive information
    const { password, ...userProfile } = user;
    
    res.status(200).json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, phone, address } = req.body;
    
    // In a real application, find and update user in database
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      const error = new Error('User not found');
      error.status = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }
    
    // Update user data
    const updatedUser = {
      ...users[userIndex],
      name: name || users[userIndex].name,
      bio: bio !== undefined ? bio : users[userIndex].bio,
      phone: phone || users[userIndex].phone,
      address: address ? { ...users[userIndex].address, ...address } : users[userIndex].address,
      updatedAt: new Date().toISOString()
    };
    
    // Save to database (mock)
    users[userIndex] = updatedUser;
    
    // Remove sensitive information
    const { password, ...userProfile } = updatedUser;
    
    res.status(200).json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload profile avatar
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.uploadAvatar = async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      const error = new Error('No file uploaded');
      error.status = 400;
      error.code = 'NO_FILE_UPLOADED';
      throw error;
    }
    
    // In a real application, process file and save to storage
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    // Update user in database (mock)
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      const error = new Error('User not found');
      error.status = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }
    
    // Update avatar URL
    users[userIndex].avatar = avatarUrl;
    users[userIndex].updatedAt = new Date().toISOString();
    
    res.status(200).json({
      success: true,
      data: {
        avatar: avatarUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user preferences
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getPreferences = async (req, res, next) => {
  try {
    // In a real application, fetch user from database
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }
    
    res.status(200).json({
      success: true,
      data: user.preferences || {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user preferences
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.updatePreferences = async (req, res, next) => {
  try {
    const { language, currency, notifications, marketing, theme } = req.body;
    
    // In a real application, find and update user in database
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      const error = new Error('User not found');
      error.status = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }
    
    // Get current preferences
    const currentPreferences = users[userIndex].preferences || {};
    
    // Update preferences
    const updatedPreferences = {
      ...currentPreferences,
      language: language || currentPreferences.language,
      currency: currency || currentPreferences.currency,
      notifications: notifications ? { ...currentPreferences.notifications, ...notifications } : currentPreferences.notifications,
      marketing: marketing !== undefined ? marketing : currentPreferences.marketing,
      theme: theme || currentPreferences.theme
    };
    
    // Save to database (mock)
    users[userIndex].preferences = updatedPreferences;
    users[userIndex].updatedAt = new Date().toISOString();
    
    res.status(200).json({
      success: true,
      data: updatedPreferences
    });
  } catch (error) {
    next(error);
  }
}; 