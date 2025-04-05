/**
 * Authentication Service
 * Handles user authentication, token generation and verification
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class AuthService {
  constructor() {
    this.secretKey = process.env.JWT_SECRET || 'your-secret-key';
    this.tokenExpiration = process.env.JWT_EXPIRATION || '1h';
    this.refreshTokenExpiration = process.env.REFRESH_TOKEN_EXPIRATION || '7d';
    this.refreshTokens = new Map(); // In production, use Redis or a database
  }

  /**
   * Generate a JWT token
   * @param {Object} user - User data to encode in token
   * @returns {String} JWT token
   */
  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role || 'user'
    };

    return jwt.sign(payload, this.secretKey, { expiresIn: this.tokenExpiration });
  }

  /**
   * Generate a refresh token
   * @param {Object} user - User data
   * @returns {String} Refresh token
   */
  generateRefreshToken(user) {
    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      this.secretKey,
      { expiresIn: this.refreshTokenExpiration }
    );

    // Store refresh token (in production, save to database or Redis)
    this.refreshTokens.set(refreshToken, {
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return refreshToken;
  }

  /**
   * Verify a JWT token
   * @param {String} token - JWT token to verify
   * @returns {Object} Decoded token payload
   */
  async verifyToken(token) {
    return jwt.verify(token, this.secretKey);
  }

  /**
   * Verify a refresh token
   * @param {String} token - Refresh token to verify
   * @returns {Object|null} User data or null if invalid
   */
  async verifyRefreshToken(token) {
    try {
      // Verify token signature
      const decoded = jwt.verify(token, this.secretKey);
      
      // Check if token exists in storage
      const storedToken = this.refreshTokens.get(token);
      if (!storedToken || storedToken.userId !== decoded.id) {
        return null;
      }
      
      // Check if token is expired
      if (new Date() > storedToken.expiresAt) {
        this.refreshTokens.delete(token);
        return null;
      }
      
      return { id: decoded.id };
    } catch (error) {
      return null;
    }
  }

  /**
   * Invalidate a refresh token
   * @param {String} token - Refresh token to invalidate
   */
  invalidateRefreshToken(token) {
    this.refreshTokens.delete(token);
  }

  /**
   * Hash a password
   * @param {String} password - Plain password
   * @returns {String} Hashed password
   */
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare password with hash
   * @param {String} password - Plain password
   * @param {String} hash - Hashed password
   * @returns {Boolean} True if password matches
   */
  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }
}

module.exports = AuthService; 