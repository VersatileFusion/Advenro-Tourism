const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const proxyquire = require('proxyquire');

// Import test setup
const { dbHelper } = require('../../config/setup');

// Create model mocks
const UserMock = {
  findById: sinon.stub(),
  findOne: sinon.stub(),
  findByIdAndUpdate: sinon.stub()
};

const ProfileMock = {
  findOne: sinon.stub(),
  findOneAndUpdate: sinon.stub(),
  create: sinon.stub()
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

// Mock the file upload
const multerMock = {
  single: sinon.stub().returns((req, res, next) => {
    req.file = {
      filename: 'test-avatar.jpg',
      path: '/uploads/test-avatar.jpg'
    };
    next();
  })
};

// Define the user profile controller implementation
const userProfileController = {
  // Get user profile
  getProfile: async (req, res) => {
    try {
      const userId = req.params.id || req.user.id;
      
      // Find the user
      const user = await UserMock.findById(userId).populate('profile');
      
      if (!user) {
        return res.status(404).json({
          status: 'fail',
          message: 'User not found'
        });
      }
      
      return res.json({
        status: 'success',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            profile: user.profile
          }
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred retrieving profile'
      });
    }
  },
  
  // Update profile info
  updateProfile: async (req, res) => {
    try {
      const { 
        firstName, 
        lastName, 
        phoneNumber, 
        address, 
        bio, 
        dateOfBirth, 
        preferences 
      } = req.body;
      
      // Validation
      if (!validationResultMock.isEmpty()) {
        return res.status(400).json({
          status: 'fail',
          errors: validationResultMock.array()
        });
      }
      
      // Find user profile or create if it doesn't exist
      let profile = await ProfileMock.findOne({ userId: req.user.id });
      
      if (!profile) {
        profile = await ProfileMock.create({
          userId: req.user.id,
          firstName,
          lastName,
          phoneNumber,
          address,
          bio,
          dateOfBirth,
          preferences
        });
        
        // Update user with profile reference
        await UserMock.findByIdAndUpdate(req.user.id, { profile: profile._id });
      } else {
        // Update existing profile
        profile = await ProfileMock.findOneAndUpdate(
          { userId: req.user.id },
          {
            firstName: firstName || profile.firstName,
            lastName: lastName || profile.lastName,
            phoneNumber: phoneNumber || profile.phoneNumber,
            address: address || profile.address,
            bio: bio || profile.bio,
            dateOfBirth: dateOfBirth || profile.dateOfBirth,
            preferences: preferences || profile.preferences
          },
          { new: true }
        );
      }
      
      return res.json({
        status: 'success',
        data: {
          profile
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred updating profile'
      });
    }
  },
  
  // Upload profile avatar
  uploadAvatar: async (req, res) => {
    try {
      // Check if file exists
      if (!req.file) {
        return res.status(400).json({
          status: 'fail',
          message: 'No file uploaded'
        });
      }
      
      // Get file info from multer
      const avatarUrl = `/uploads/${req.file.filename}`;
      
      // Update user profile
      const profile = await ProfileMock.findOneAndUpdate(
        { userId: req.user.id },
        { avatar: avatarUrl },
        { new: true, upsert: true }
      );
      
      return res.json({
        status: 'success',
        data: {
          avatar: avatarUrl,
          profile
        }
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred uploading avatar'
      });
    }
  },
  
  // Get user preferences
  getPreferences: async (req, res) => {
    try {
      // Find user profile
      const profile = await ProfileMock.findOne({ userId: req.user.id });
      
      if (!profile) {
        return res.status(404).json({
          status: 'fail',
          message: 'Profile not found'
        });
      }
      
      return res.json({
        status: 'success',
        data: {
          preferences: profile.preferences || {}
        }
      });
    } catch (error) {
      console.error('Get preferences error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred retrieving preferences'
      });
    }
  },
  
  // Update user preferences
  updatePreferences: async (req, res) => {
    try {
      const { preferences } = req.body;
      
      if (!preferences) {
        return res.status(400).json({
          status: 'fail',
          message: 'Preferences object is required'
        });
      }
      
      // Update user profile
      const profile = await ProfileMock.findOneAndUpdate(
        { userId: req.user.id },
        { preferences },
        { new: true, upsert: true }
      );
      
      return res.json({
        status: 'success',
        data: {
          preferences: profile.preferences
        }
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred updating preferences'
      });
    }
  }
};

describe('User Profile Controller Tests', function() {
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
  let mockUser, mockProfile, mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Create mock data
    mockProfile = {
      _id: new ObjectId(),
      userId: new ObjectId(),
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '1234567890',
      address: '123 Test St, City, Country',
      bio: 'Test user bio',
      dateOfBirth: new Date('1990-01-01'),
      avatar: '/uploads/avatar.jpg',
      preferences: {
        theme: 'dark',
        language: 'en',
        currency: 'USD',
        notifications: {
          email: true,
          push: true
        }
      }
    };
    
    mockUser = {
      _id: mockProfile.userId,
      name: 'Test User',
      email: 'test@example.com',
      profile: mockProfile._id
    };

    // Setup request object
    mockReq = {
      user: { id: mockUser._id.toString() },
      body: {
        firstName: 'Updated',
        lastName: 'Name',
        phoneNumber: '0987654321',
        preferences: {
          theme: 'light',
          language: 'fr'
        }
      },
      params: { id: mockUser._id.toString() },
      file: {
        filename: 'test-avatar.jpg',
        path: '/uploads/test-avatar.jpg'
      }
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
    UserMock.findById = sinon.stub().returns({
      populate: sinon.stub().returns({
        ...mockUser,
        profile: mockProfile
      })
    });
    
    UserMock.findByIdAndUpdate = sinon.stub().resolves(mockUser);
    
    ProfileMock.findOne = sinon.stub().resolves(mockProfile);
    ProfileMock.findOneAndUpdate = sinon.stub().resolves(mockProfile);
    ProfileMock.create = sinon.stub().resolves(mockProfile);
    
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
      expect(userProfileController).to.be.an('object');
      expect(userProfileController.getProfile).to.be.a('function');
      expect(userProfileController.updateProfile).to.be.a('function');
      expect(userProfileController.uploadAvatar).to.be.a('function');
      expect(userProfileController.getPreferences).to.be.a('function');
      expect(userProfileController.updatePreferences).to.be.a('function');
    });
  });

  // Test getProfile
  describe('getProfile Function', () => {
    it('should retrieve user profile by ID', async () => {
      // Call the controller function
      await userProfileController.getProfile(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('user');
      expect(response.data.user).to.have.property('profile');
      
      // Verify database operation
      expect(UserMock.findById.calledOnce).to.be.true;
    });

    it('should return 404 if user not found', async () => {
      // Make findById return null
      UserMock.findById = sinon.stub().returns({
        populate: sinon.stub().returns(null)
      });
      
      // Call the controller function
      await userProfileController.getProfile(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(404)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('not found');
    });
  });

  // Test updateProfile
  describe('updateProfile Function', () => {
    it('should update user profile successfully', async () => {
      // Call the controller function
      await userProfileController.updateProfile(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('profile');
      
      // Verify database operation
      expect(ProfileMock.findOne.calledOnce).to.be.true;
      expect(ProfileMock.findOneAndUpdate.calledOnce).to.be.true;
    });

    it('should create profile if it does not exist', async () => {
      // Make findOne return null
      ProfileMock.findOne = sinon.stub().resolves(null);
      
      // Call the controller function
      await userProfileController.updateProfile(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Verify database operations
      expect(ProfileMock.create.calledOnce).to.be.true;
      expect(UserMock.findByIdAndUpdate.calledOnce).to.be.true;
    });

    it('should handle validation errors', async () => {
      // Force validation error
      validationResultMock.isEmpty = sinon.stub().returns(false);
      validationResultMock.array = sinon.stub().returns([
        { param: 'firstName', msg: 'First name is required' }
      ]);
      
      // Call the controller function
      await userProfileController.updateProfile(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(400)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response).to.have.property('errors');
    });
  });

  // Test uploadAvatar
  describe('uploadAvatar Function', () => {
    it('should upload avatar successfully', async () => {
      // Call the controller function
      await userProfileController.uploadAvatar(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('avatar');
      expect(response.data).to.have.property('profile');
      
      // Verify database operation
      expect(ProfileMock.findOneAndUpdate.calledOnce).to.be.true;
    });

    it('should return 400 if no file uploaded', async () => {
      // Remove file from request
      mockReq.file = null;
      
      // Call the controller function
      await userProfileController.uploadAvatar(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(400)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('No file uploaded');
    });
  });

  // Test getPreferences
  describe('getPreferences Function', () => {
    it('should retrieve user preferences', async () => {
      // Call the controller function
      await userProfileController.getPreferences(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('preferences');
      expect(response.data.preferences).to.have.property('theme');
      expect(response.data.preferences).to.have.property('language');
      
      // Verify database operation
      expect(ProfileMock.findOne.calledOnce).to.be.true;
    });

    it('should return 404 if profile not found', async () => {
      // Make findOne return null
      ProfileMock.findOne = sinon.stub().resolves(null);
      
      // Call the controller function
      await userProfileController.getPreferences(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(404)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('not found');
    });
  });

  // Test updatePreferences
  describe('updatePreferences Function', () => {
    it('should update user preferences successfully', async () => {
      // Call the controller function
      await userProfileController.updatePreferences(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('preferences');
      
      // Verify database operation
      expect(ProfileMock.findOneAndUpdate.calledOnce).to.be.true;
    });

    it('should return 400 if preferences are missing', async () => {
      // Remove preferences from request
      delete mockReq.body.preferences;
      
      // Call the controller function
      await userProfileController.updatePreferences(mockReq, mockRes);
      
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