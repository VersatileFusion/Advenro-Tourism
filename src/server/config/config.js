/**
 * Server configuration settings
 */
const config = {
  // Application settings
  port: process.env.PORT || 3000,
  
  // JWT settings
  jwtSecret: process.env.JWT_SECRET || 'test-jwt-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  
  // Database settings
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/advenro',
  mongoTestURI: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/advenro-test',
  
  // Email settings
  emailService: process.env.EMAIL_SERVICE || 'gmail',
  emailUser: process.env.EMAIL_USER,
  emailPassword: process.env.EMAIL_PASSWORD,
  
  // Frontend URL for links in emails
  frontendURL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Logging level
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test'
};

module.exports = config; 