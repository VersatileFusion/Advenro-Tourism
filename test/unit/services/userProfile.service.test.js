const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Import the service
const userProfileService = require('../../../src/services/userProfileService');

// Import models
const User = require('../../../src/models/User');
const Profile = require('../../../src/models/Profile');

// Load test setup
require('../../config/setup');

describe('User Profile Service Tests', function() {
  this.timeout(10000);

  // Test data
  let mockUser;
  let mockProfile;

  beforeEach(() => {
    // Create mock data
    mockUser = {
      _id: new ObjectId(),
      email: 'test@example.com',
      name: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockProfile = {
      _id: new ObjectId(),
      user: mockUser._id,
      bio: 'Test bio',
      birthdate: new Date('1990-01-01'),
      gender: 'Male',
      phoneNumber: '+1234567890',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country'
      },
      preferences: {
        language: 'English',
        currency: 'USD',
        notifications: {
          email: true,
          sms: false
        },
        travelPreferences: ['Adventure', 'Relaxation']
      },
      socialMedia: {
        facebook: 'https://facebook.com/testuser',
        instagram: 'https://instagram.com/testuser',
        twitter: 'https://twitter.com/testuser'
      },
      profilePicture: 'https://example.com/profile.jpg',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Setup stubs
    sinon.stub(User, 'findById').resolves(mockUser);
    sinon.stub(User, 'findByIdAndUpdate').resolves(mockUser);
    sinon.stub(Profile, 'findOne').resolves(mockProfile);
    sinon.stub(Profile, 'findOneAndUpdate').resolves(mockProfile);
    sinon.stub(Profile, 'create').resolves(mockProfile);
  });

  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });

  describe('getUserProfile', () => {
    it('should retrieve a user profile by user ID', async () => {
      const userId = mockUser._id.toString();

      const result = await userProfileService.getUserProfile(userId);

      expect(result).to.exist;
      expect(result.user).to.deep.equal(mockUser);
      expect(result.profile).to.deep.equal(mockProfile);
      expect(User.findById.calledOnce).to.be.true;
      expect(User.findById.calledWith(userId)).to.be.true;
      expect(Profile.findOne.calledOnce).to.be.true;
      expect(Profile.findOne.calledWith({ user: userId })).to.be.true;
    });

    it('should return user without profile if profile not found', async () => {
      // Modify the findOne stub to return null
      Profile.findOne.resolves(null);

      const userId = mockUser._id.toString();

      const result = await userProfileService.getUserProfile(userId);

      expect(result).to.exist;
      expect(result.user).to.deep.equal(mockUser);
      expect(result.profile).to.be.null;
      expect(User.findById.calledOnce).to.be.true;
      expect(Profile.findOne.calledOnce).to.be.true;
    });

    it('should return null if user not found', async () => {
      // Modify the findById stub to return null
      User.findById.resolves(null);

      const userId = mockUser._id.toString();

      const result = await userProfileService.getUserProfile(userId);

      expect(result).to.be.null;
      expect(User.findById.calledOnce).to.be.true;
      expect(Profile.findOne.called).to.be.false;
    });

    it('should handle and throw database errors', async () => {
      // Make findById throw an error
      User.findById.rejects(new Error('Database error'));

      try {
        await userProfileService.getUserProfile(mockUser._id.toString());
        // If we get here, the test should fail
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error).to.exist;
        expect(error.message).to.equal('Database error');
      }
    });
  });

  describe('createUserProfile', () => {
    it('should create a new profile for a user', async () => {
      const userId = mockUser._id.toString();
      const profileData = {
        bio: 'New bio',
        birthdate: new Date('1992-05-15'),
        gender: 'Female',
        phoneNumber: '+0987654321',
        address: {
          street: '456 New St',
          city: 'New City',
          state: 'New State',
          zipCode: '54321',
          country: 'New Country'
        },
        preferences: {
          language: 'Spanish',
          currency: 'EUR',
          notifications: {
            email: true,
            sms: true
          },
          travelPreferences: ['Culture', 'Food']
        }
      };

      // Modify the findOne stub to return null first (no existing profile)
      Profile.findOne.resolves(null);

      const result = await userProfileService.createUserProfile(userId, profileData);

      expect(result).to.exist;
      expect(result).to.deep.equal(mockProfile);
      expect(User.findById.calledOnce).to.be.true;
      expect(Profile.findOne.calledOnce).to.be.true;
      expect(Profile.create.calledOnce).to.be.true;
      
      const createCallArgs = Profile.create.getCall(0).args[0];
      expect(createCallArgs).to.have.property('user', userId);
      expect(createCallArgs).to.have.property('bio', profileData.bio);
    });

    it('should update existing profile if one exists', async () => {
      const userId = mockUser._id.toString();
      const profileData = {
        bio: 'Updated bio',
        phoneNumber: '+0987654321'
      };

      const result = await userProfileService.createUserProfile(userId, profileData);

      expect(result).to.exist;
      expect(result).to.deep.equal(mockProfile);
      expect(User.findById.calledOnce).to.be.true;
      expect(Profile.findOne.calledOnce).to.be.true;
      expect(Profile.create.called).to.be.false;
      expect(Profile.findOneAndUpdate.calledOnce).to.be.true;
      
      const updateCallArgs = Profile.findOneAndUpdate.getCall(0).args;
      expect(updateCallArgs[0]).to.deep.equal({ user: userId });
      expect(updateCallArgs[1]).to.include(profileData);
    });

    it('should throw an error if user not found', async () => {
      // Modify the findById stub to return null
      User.findById.resolves(null);

      const userId = mockUser._id.toString();
      const profileData = { bio: 'New bio' };

      try {
        await userProfileService.createUserProfile(userId, profileData);
        // If we get here, the test should fail
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error).to.exist;
        expect(error.message).to.include('User not found');
      }
    });

    it('should handle and throw validation errors', async () => {
      // Make Profile.create throw a validation error
      Profile.findOne.resolves(null);
      Profile.create.restore();
      
      const validationError = new mongoose.Error.ValidationError();
      validationError.errors = { phoneNumber: { message: 'Invalid phone number format' } };
      sinon.stub(Profile, 'create').throws(validationError);

      try {
        await userProfileService.createUserProfile(
          mockUser._id.toString(),
          { phoneNumber: 'invalid' }
        );
        // If we get here, the test should fail
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error).to.exist;
        expect(error).to.be.an.instanceof(mongoose.Error.ValidationError);
        expect(error.errors).to.have.property('phoneNumber');
      }
    });
  });

  describe('updateUserProfile', () => {
    it('should update an existing user profile', async () => {
      const userId = mockUser._id.toString();
      const profileUpdate = {
        bio: 'Updated bio',
        address: {
          city: 'Updated City',
          country: 'Updated Country'
        },
        preferences: {
          language: 'French'
        }
      };

      const result = await userProfileService.updateUserProfile(userId, profileUpdate);

      expect(result).to.exist;
      expect(result).to.deep.equal(mockProfile);
      expect(User.findById.calledOnce).to.be.true;
      expect(Profile.findOneAndUpdate.calledOnce).to.be.true;
      
      const updateCallArgs = Profile.findOneAndUpdate.getCall(0).args;
      expect(updateCallArgs[0]).to.deep.equal({ user: userId });
      // Check that the update object includes our changes
      expect(updateCallArgs[1]).to.have.nested.property('bio', profileUpdate.bio);
      expect(updateCallArgs[1]).to.have.nested.property('address.city', profileUpdate.address.city);
      expect(updateCallArgs[1]).to.have.nested.property('preferences.language', profileUpdate.preferences.language);
    });

    it('should create a profile if one does not exist', async () => {
      // Modify the findOne stub to return null first (no existing profile)
      Profile.findOne.onFirstCall().resolves(null);
      
      const userId = mockUser._id.toString();
      const profileData = {
        bio: 'New bio',
        phoneNumber: '+0987654321'
      };

      const result = await userProfileService.updateUserProfile(userId, profileData);

      expect(result).to.exist;
      expect(result).to.deep.equal(mockProfile);
      expect(User.findById.calledOnce).to.be.true;
      expect(Profile.findOne.calledOnce).to.be.true;
      expect(Profile.create.calledOnce).to.be.true;
      
      const createCallArgs = Profile.create.getCall(0).args[0];
      expect(createCallArgs).to.have.property('user', userId);
      expect(createCallArgs).to.have.property('bio', profileData.bio);
    });

    it('should throw an error if user not found', async () => {
      // Modify the findById stub to return null
      User.findById.resolves(null);

      const userId = mockUser._id.toString();
      const profileData = { bio: 'Updated bio' };

      try {
        await userProfileService.updateUserProfile(userId, profileData);
        // If we get here, the test should fail
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error).to.exist;
        expect(error.message).to.include('User not found');
      }
    });

    it('should handle partial updates correctly', async () => {
      const userId = mockUser._id.toString();
      
      // Just update one field
      const profileUpdate = {
        phoneNumber: '+9876543210'
      };

      const result = await userProfileService.updateUserProfile(userId, profileUpdate);

      expect(result).to.exist;
      expect(result).to.deep.equal(mockProfile);
      expect(Profile.findOneAndUpdate.calledOnce).to.be.true;
      
      const updateCallArgs = Profile.findOneAndUpdate.getCall(0).args;
      expect(updateCallArgs[1]).to.have.property('phoneNumber', profileUpdate.phoneNumber);
      // Make sure we're not overwriting other fields
      expect(updateCallArgs[1]).to.not.have.property('bio');
      expect(updateCallArgs[1]).to.not.have.property('address');
    });
  });

  describe('updateProfilePicture', () => {
    it('should update the profile picture', async () => {
      const userId = mockUser._id.toString();
      const newPictureUrl = 'https://example.com/new-profile.jpg';

      // Setup mock for file upload service
      const uploadServiceStub = sinon.stub().resolves(newPictureUrl);

      const result = await userProfileService.updateProfilePicture(
        userId, 
        { buffer: Buffer.from('test image') },
        uploadServiceStub
      );

      expect(result).to.exist;
      expect(result).to.deep.equal(mockProfile);
      expect(uploadServiceStub.calledOnce).to.be.true;
      expect(Profile.findOneAndUpdate.calledOnce).to.be.true;
      
      const updateCallArgs = Profile.findOneAndUpdate.getCall(0).args;
      expect(updateCallArgs[0]).to.deep.equal({ user: userId });
      expect(updateCallArgs[1]).to.have.property('profilePicture', newPictureUrl);
    });

    it('should create a profile with picture if profile does not exist', async () => {
      // Modify the findOne stub to return null first (no existing profile)
      Profile.findOne.resolves(null);
      
      const userId = mockUser._id.toString();
      const newPictureUrl = 'https://example.com/new-profile.jpg';

      // Setup mock for file upload service
      const uploadServiceStub = sinon.stub().resolves(newPictureUrl);

      const result = await userProfileService.updateProfilePicture(
        userId,
        { buffer: Buffer.from('test image') },
        uploadServiceStub
      );

      expect(result).to.exist;
      expect(result).to.deep.equal(mockProfile);
      expect(uploadServiceStub.calledOnce).to.be.true;
      expect(Profile.create.calledOnce).to.be.true;
      
      const createCallArgs = Profile.create.getCall(0).args[0];
      expect(createCallArgs).to.have.property('user', userId);
      expect(createCallArgs).to.have.property('profilePicture', newPictureUrl);
    });

    it('should throw an error if file upload fails', async () => {
      const userId = mockUser._id.toString();
      
      // Setup mock for file upload service that fails
      const uploadError = new Error('Upload failed');
      const uploadServiceStub = sinon.stub().rejects(uploadError);

      try {
        await userProfileService.updateProfilePicture(
          userId,
          { buffer: Buffer.from('test image') },
          uploadServiceStub
        );
        // If we get here, the test should fail
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error).to.exist;
        expect(error.message).to.equal('Upload failed');
      }
    });
  });
}); 