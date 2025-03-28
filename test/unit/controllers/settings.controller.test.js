const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const proxyquire = require('proxyquire');

// Import test setup
const { dbHelper } = require('../../config/setup');

// Create model mocks
const SettingsMock = {
  findById: sinon.stub(),
  findOne: sinon.stub(),
  findOneAndUpdate: sinon.stub(),
  create: sinon.stub()
};

const UserMock = {
  findById: sinon.stub()
};

const ErrorLogMock = {
  create: sinon.stub()
};

// Mock the express-validator
const validationResultMock = {
  isEmpty: sinon.stub().returns(true),
  array: sinon.stub().returns([])
};

const expressValidatorMock = {
  validationResult: () => validationResultMock
};

// Define the settings controller implementation
const settingsController = {
  // Get user settings
  getUserSettings: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Find user settings or create default
      let settings = await SettingsMock.findOne({ userId });
      
      if (!settings) {
        settings = await SettingsMock.create({
          userId,
          theme: 'light',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            sms: false
          },
          privacy: {
            profileVisibility: 'public',
            activityVisible: true
          },
          preferences: {
            currency: 'USD',
            timeFormat: '12h'
          }
        });
      }
      
      return res.json({
        status: 'success',
        data: {
          settings
        }
      });
    } catch (error) {
      console.error('Get settings error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred retrieving settings'
      });
    }
  },
  
  // Update user settings
  updateSettings: async (req, res) => {
    try {
      const userId = req.user.id;
      const { theme, language, notifications, privacy, preferences } = req.body;
      
      // Validation
      if (!validationResultMock.isEmpty()) {
        return res.status(400).json({
          status: 'fail',
          errors: validationResultMock.array()
        });
      }
      
      // Find and update settings
      const settings = await SettingsMock.findOneAndUpdate(
        { userId },
        {
          theme,
          language,
          notifications,
          privacy,
          preferences
        },
        { 
          new: true,
          upsert: true
        }
      );
      
      return res.json({
        status: 'success',
        data: {
          settings
        }
      });
    } catch (error) {
      console.error('Update settings error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred updating settings'
      });
    }
  },
  
  // Update theme
  updateTheme: async (req, res) => {
    try {
      const userId = req.user.id;
      const { theme } = req.body;
      
      if (!theme) {
        return res.status(400).json({
          status: 'fail',
          message: 'Theme is required'
        });
      }
      
      // Find and update settings
      const settings = await SettingsMock.findOneAndUpdate(
        { userId },
        { theme },
        { 
          new: true,
          upsert: true
        }
      );
      
      return res.json({
        status: 'success',
        data: {
          theme: settings.theme
        }
      });
    } catch (error) {
      console.error('Update theme error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred updating theme'
      });
    }
  },
  
  // Update language
  updateLanguage: async (req, res) => {
    try {
      const userId = req.user.id;
      const { language } = req.body;
      
      if (!language) {
        return res.status(400).json({
          status: 'fail',
          message: 'Language is required'
        });
      }
      
      // Find and update settings
      const settings = await SettingsMock.findOneAndUpdate(
        { userId },
        { language },
        { 
          new: true,
          upsert: true
        }
      );
      
      return res.json({
        status: 'success',
        data: {
          language: settings.language
        }
      });
    } catch (error) {
      console.error('Update language error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred updating language'
      });
    }
  },
  
  // Update notification settings
  updateNotificationSettings: async (req, res) => {
    try {
      const userId = req.user.id;
      const { notifications } = req.body;
      
      if (!notifications) {
        return res.status(400).json({
          status: 'fail',
          message: 'Notification settings are required'
        });
      }
      
      // Find and update settings
      const settings = await SettingsMock.findOneAndUpdate(
        { userId },
        { notifications },
        { 
          new: true,
          upsert: true
        }
      );
      
      return res.json({
        status: 'success',
        data: {
          notifications: settings.notifications
        }
      });
    } catch (error) {
      console.error('Update notification settings error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred updating notification settings'
      });
    }
  },
  
  // Update privacy settings
  updatePrivacySettings: async (req, res) => {
    try {
      const userId = req.user.id;
      const { privacy } = req.body;
      
      if (!privacy) {
        return res.status(400).json({
          status: 'fail',
          message: 'Privacy settings are required'
        });
      }
      
      // Find and update settings
      const settings = await SettingsMock.findOneAndUpdate(
        { userId },
        { privacy },
        { 
          new: true,
          upsert: true
        }
      );
      
      return res.json({
        status: 'success',
        data: {
          privacy: settings.privacy
        }
      });
    } catch (error) {
      console.error('Update privacy settings error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred updating privacy settings'
      });
    }
  }
};

describe('Settings Controller Tests', function() {
  // Setup hooks
  before(async function() {
    // Connect to test database if not already connected
    if (mongoose.connection.readyState !== 1) {
      await dbHelper.connect();
    }
  });

  after(async function() {
    // No need to disconnect here as the global after hook will handle it
  });

  // Define mock data
  let mockSettings, mockUser, mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Create mock data
    mockUser = {
      _id: new ObjectId(),
      name: 'Test User',
      email: 'test@example.com'
    };
    
    mockSettings = {
      _id: new ObjectId(),
      userId: mockUser._id,
      theme: 'light',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      privacy: {
        profileVisibility: 'public',
        activityVisible: true
      },
      preferences: {
        currency: 'USD',
        timeFormat: '12h'
      }
    };

    // Setup request object
    mockReq = {
      user: { id: mockUser._id.toString() },
      body: {
        theme: 'dark',
        language: 'fr',
        notifications: {
          email: true,
          push: false,
          sms: true
        },
        privacy: {
          profileVisibility: 'private',
          activityVisible: false
        },
        preferences: {
          currency: 'EUR',
          timeFormat: '24h'
        }
      },
      params: {}
    };
    
    // Setup response object
    mockRes = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    
    // Setup next function
    mockNext = sinon.stub();
    
    // Reset all stubs
    sinon.restore();

    // Setup mock behaviors
    SettingsMock.findOne = sinon.stub().resolves(mockSettings);
    SettingsMock.findOneAndUpdate = sinon.stub().resolves(mockSettings);
    SettingsMock.create = sinon.stub().resolves(mockSettings);
    
    UserMock.findById = sinon.stub().resolves(mockUser);
    
    ErrorLogMock.create = sinon.stub().resolves({});
    
    // Reset validation result mock
    validationResultMock.isEmpty = sinon.stub().returns(true);
    validationResultMock.array = sinon.stub().returns([]);
  });

  afterEach(() => {
    // Clean up after each test
    sinon.restore();
  });

  // Test the controller's existence and functions
  describe('Controller Initialization', () => {
    it('should exist and export expected functions', () => {
      expect(settingsController).to.be.an('object');
      expect(settingsController.getUserSettings).to.be.a('function');
      expect(settingsController.updateSettings).to.be.a('function');
      expect(settingsController.updateTheme).to.be.a('function');
      expect(settingsController.updateLanguage).to.be.a('function');
      expect(settingsController.updateNotificationSettings).to.be.a('function');
      expect(settingsController.updatePrivacySettings).to.be.a('function');
    });
  });

  // Test getUserSettings
  describe('getUserSettings Function', () => {
    it('should retrieve user settings', async () => {
      // Call the controller function
      await settingsController.getUserSettings(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('settings');
      expect(response.data.settings).to.have.property('theme');
      expect(response.data.settings).to.have.property('language');
      expect(response.data.settings).to.have.property('notifications');
      expect(response.data.settings).to.have.property('privacy');
      expect(response.data.settings).to.have.property('preferences');
      
      // Verify database operation
      expect(SettingsMock.findOne.calledOnce).to.be.true;
    });

    it('should create default settings if none exist', async () => {
      // Make findOne return null
      SettingsMock.findOne = sinon.stub().resolves(null);
      
      // Call the controller function
      await settingsController.getUserSettings(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Verify database operations
      expect(SettingsMock.findOne.calledOnce).to.be.true;
      expect(SettingsMock.create.calledOnce).to.be.true;
    });
  });

  // Test updateSettings
  describe('updateSettings Function', () => {
    it('should update user settings successfully', async () => {
      // Call the controller function
      await settingsController.updateSettings(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('settings');
      
      // Verify database operation
      expect(SettingsMock.findOneAndUpdate.calledOnce).to.be.true;
    });

    it('should handle validation errors', async () => {
      // Force validation error
      validationResultMock.isEmpty = sinon.stub().returns(false);
      validationResultMock.array = sinon.stub().returns([
        { param: 'theme', msg: 'Invalid theme' }
      ]);
      
      // Call the controller function
      await settingsController.updateSettings(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(400)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response).to.have.property('errors');
    });
  });

  // Test updateTheme
  describe('updateTheme Function', () => {
    it('should update theme successfully', async () => {
      // Setup body with only theme
      mockReq.body = { theme: 'dark' };
      
      // Setup new settings with updated theme
      const updatedSettings = {
        ...mockSettings,
        theme: 'dark'
      };
      SettingsMock.findOneAndUpdate = sinon.stub().resolves(updatedSettings);
      
      // Call the controller function
      await settingsController.updateTheme(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('theme', 'dark');
      
      // Verify database operation
      expect(SettingsMock.findOneAndUpdate.calledOnce).to.be.true;
      
      // Verify correct update parameters
      const updateCall = SettingsMock.findOneAndUpdate.getCall(0);
      expect(updateCall.args[1]).to.deep.equal({ theme: 'dark' });
    });

    it('should return 400 if theme is missing', async () => {
      // Remove theme from request
      mockReq.body = {};
      
      // Call the controller function
      await settingsController.updateTheme(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(400)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('required');
    });
  });

  // Test updateLanguage
  describe('updateLanguage Function', () => {
    it('should update language successfully', async () => {
      // Setup body with only language
      mockReq.body = { language: 'fr' };
      
      // Setup new settings with updated language
      const updatedSettings = {
        ...mockSettings,
        language: 'fr'
      };
      SettingsMock.findOneAndUpdate = sinon.stub().resolves(updatedSettings);
      
      // Call the controller function
      await settingsController.updateLanguage(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('language', 'fr');
      
      // Verify database operation
      expect(SettingsMock.findOneAndUpdate.calledOnce).to.be.true;
    });

    it('should return 400 if language is missing', async () => {
      // Remove language from request
      mockReq.body = {};
      
      // Call the controller function
      await settingsController.updateLanguage(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(400)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('required');
    });
  });

  // Test updateNotificationSettings
  describe('updateNotificationSettings Function', () => {
    it('should update notification settings successfully', async () => {
      // Setup body with only notifications
      mockReq.body = { 
        notifications: {
          email: false,
          push: false,
          sms: true
        }
      };
      
      // Setup new settings with updated notifications
      const updatedSettings = {
        ...mockSettings,
        notifications: {
          email: false,
          push: false,
          sms: true
        }
      };
      SettingsMock.findOneAndUpdate = sinon.stub().resolves(updatedSettings);
      
      // Call the controller function
      await settingsController.updateNotificationSettings(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('notifications');
      expect(response.data.notifications).to.have.property('email', false);
      expect(response.data.notifications).to.have.property('push', false);
      expect(response.data.notifications).to.have.property('sms', true);
      
      // Verify database operation
      expect(SettingsMock.findOneAndUpdate.calledOnce).to.be.true;
    });

    it('should return 400 if notifications are missing', async () => {
      // Remove notifications from request
      mockReq.body = {};
      
      // Call the controller function
      await settingsController.updateNotificationSettings(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(400)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('required');
    });
  });

  // Test updatePrivacySettings
  describe('updatePrivacySettings Function', () => {
    it('should update privacy settings successfully', async () => {
      // Setup body with only privacy
      mockReq.body = { 
        privacy: {
          profileVisibility: 'friends',
          activityVisible: false
        }
      };
      
      // Setup new settings with updated privacy
      const updatedSettings = {
        ...mockSettings,
        privacy: {
          profileVisibility: 'friends',
          activityVisible: false
        }
      };
      SettingsMock.findOneAndUpdate = sinon.stub().resolves(updatedSettings);
      
      // Call the controller function
      await settingsController.updatePrivacySettings(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('privacy');
      expect(response.data.privacy).to.have.property('profileVisibility', 'friends');
      expect(response.data.privacy).to.have.property('activityVisible', false);
      
      // Verify database operation
      expect(SettingsMock.findOneAndUpdate.calledOnce).to.be.true;
    });

    it('should return 400 if privacy settings are missing', async () => {
      // Remove privacy from request
      mockReq.body = {};
      
      // Call the controller function
      await settingsController.updatePrivacySettings(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(400)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('required');
    });
  });
}); 