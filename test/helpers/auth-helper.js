const jwt = require('jsonwebtoken');
const User = require('../../src/server/models/User');

/**
 * Create a test user in the database
 * @param {Object} userData - User data to create
 * @returns {Object} - Created user object
 */
const createUser = async (userData = {}) => {
  const defaultUser = {
    email: `test${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    role: 'user'
  };

  const user = new User({
    ...defaultUser,
    ...userData
  });

  await user.save();
  return user;
};

/**
 * Generate a valid JWT token for a user
 * @param {Object} user - User object
 * @returns {string} - JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

/**
 * Create a test user and generate token
 * @param {Object} userData - User data to create
 * @returns {Object} - User object and token
 */
const createUserWithToken = async (userData = {}) => {
  const user = await createUser(userData);
  const token = generateToken(user);
  return { user, token };
};

/**
 * Create admin user with token
 * @returns {Object} - Admin user object and token
 */
const createAdminWithToken = async () => {
  return await createUserWithToken({ role: 'admin' });
};

module.exports = {
  createUser,
  generateToken,
  createUserWithToken,
  createAdminWithToken
}; 