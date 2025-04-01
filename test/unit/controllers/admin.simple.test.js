const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');

describe('Admin Controller Tests', function() {
  let req, res, next;
  
  beforeEach(() => {
    // Mock request object
    req = {
      params: {},
      body: {},
      user: { userId: 'admin123', role: 'admin' }
    };
    
    // Mock response object
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };
    
    // Mock next function
    next = sinon.spy();
  });
  
  describe('User Management', () => {
    // Mock User model
    const User = {
      find: sinon.stub(),
      findById: sinon.stub(),
      findByIdAndUpdate: sinon.stub(),
      findByIdAndDelete: sinon.stub()
    };
    
    // Reset mocks before each test
    beforeEach(() => {
      User.find.reset();
      User.findById.reset();
      User.findByIdAndUpdate.reset();
      User.findByIdAndDelete.reset();
    });
    
    // Mock admin controller for user management
    const adminController = {
      // Get all users
      getAllUsers: async (req, res) => {
        try {
          const users = await User.find().select('-password');
          return res.json(users);
        } catch (error) {
          return res.status(500).json({ message: 'Server error' });
        }
      },
      
      // Get user by ID
      getUserById: async (req, res) => {
        try {
          const user = await User.findById(req.params.id).select('-password');
          
          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }
          
          return res.json(user);
        } catch (error) {
          if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid user ID' });
          }
          return res.status(500).json({ message: 'Server error' });
        }
      },
      
      // Update user
      updateUser: async (req, res) => {
        try {
          // Check if user exists
          const user = await User.findById(req.params.id);
          
          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }
          
          // Don't allow updating own user through admin route
          if (user._id.toString() === req.user.userId) {
            return res.status(400).json({ message: 'Cannot update your own user through admin route' });
          }
          
          // Update fields
          const updatedFields = {};
          const allowedFields = ['name', 'email', 'role', 'isVerified', 'firstName', 'lastName'];
          
          allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
              updatedFields[field] = req.body[field];
            }
          });
          
          // If no fields to update
          if (Object.keys(updatedFields).length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
          }
          
          // Update user
          const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updatedFields },
            { new: true }
          ).select('-password');
          
          return res.json(updatedUser);
        } catch (error) {
          if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid user ID' });
          }
          return res.status(500).json({ message: 'Server error' });
        }
      },
      
      // Delete user
      deleteUser: async (req, res) => {
        try {
          // Check if user exists
          const user = await User.findById(req.params.id);
          
          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }
          
          // Don't allow deleting own user
          if (user._id.toString() === req.user.userId) {
            return res.status(400).json({ message: 'Cannot delete your own account through admin route' });
          }
          
          // Delete user
          await User.findByIdAndDelete(req.params.id);
          
          return res.json({ message: 'User deleted successfully' });
        } catch (error) {
          if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid user ID' });
          }
          return res.status(500).json({ message: 'Server error' });
        }
      }
    };
    
    it('should get all users', async () => {
      const mockUsers = [
        { _id: 'user1', name: 'User 1', email: 'user1@example.com', role: 'user' },
        { _id: 'user2', name: 'User 2', email: 'user2@example.com', role: 'admin' }
      ];
      
      // Setup mock to return users
      User.find.returns({
        select: sinon.stub().resolves(mockUsers)
      });
      
      await adminController.getAllUsers(req, res);
      
      expect(User.find.calledOnce).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.deep.equal(mockUsers);
    });
    
    it('should get user by ID', async () => {
      const mockUser = { 
        _id: 'user1', 
        name: 'User 1', 
        email: 'user1@example.com', 
        role: 'user' 
      };
      
      // Setup request params
      req.params.id = 'user1';
      
      // Setup mock to return user
      User.findById.withArgs('user1').returns({
        select: sinon.stub().resolves(mockUser)
      });
      
      await adminController.getUserById(req, res);
      
      expect(User.findById.calledWith('user1')).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.deep.equal(mockUser);
    });
    
    it('should return 404 if user not found', async () => {
      // Setup request params
      req.params.id = 'nonexistent';
      
      // Setup mock to return null (user not found)
      User.findById.withArgs('nonexistent').returns({
        select: sinon.stub().resolves(null)
      });
      
      await adminController.getUserById(req, res);
      
      expect(User.findById.calledWith('nonexistent')).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('message', 'User not found');
    });
    
    it('should update a user', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const mockUser = { 
        _id: userId, 
        name: 'User 1', 
        email: 'user1@example.com', 
        role: 'user',
        firstName: 'Old First',
        lastName: 'Old Last'
      };
      
      const updatedUser = {
        ...mockUser,
        role: 'admin',
        firstName: 'New First',
        lastName: 'New Last'
      };
      
      // Setup request
      req.params.id = userId;
      req.body = {
        role: 'admin',
        firstName: 'New First',
        lastName: 'New Last'
      };
      
      // Setup mocks
      User.findById.withArgs(userId).resolves(mockUser);
      User.findByIdAndUpdate.returns({
        select: sinon.stub().resolves(updatedUser)
      });
      
      await adminController.updateUser(req, res);
      
      expect(User.findById.calledWith(userId)).to.be.true;
      expect(User.findByIdAndUpdate.calledOnce).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.deep.equal(updatedUser);
    });
    
    it('should not allow updating own user through admin route', async () => {
      const adminId = 'admin123';
      const mockUser = { 
        _id: adminId, 
        name: 'Admin User',
        email: 'admin@example.com', 
        role: 'admin' 
      };
      
      // Setup request
      req.params.id = adminId;
      req.body = { role: 'user' };
      
      // Setup mocks
      User.findById.withArgs(adminId).resolves({
        _id: { toString: () => adminId },
        ...mockUser
      });
      
      await adminController.updateUser(req, res);
      
      expect(User.findById.calledWith(adminId)).to.be.true;
      expect(User.findByIdAndUpdate.called).to.be.false;
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('message', 'Cannot update your own user through admin route');
    });
    
    it('should delete a user', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const mockUser = { 
        _id: userId, 
        name: 'User to Delete', 
        email: 'delete@example.com', 
        role: 'user' 
      };
      
      // Setup request
      req.params.id = userId;
      
      // Setup mocks
      User.findById.withArgs(userId).resolves({
        _id: { toString: () => userId },
        ...mockUser
      });
      User.findByIdAndDelete.withArgs(userId).resolves({});
      
      await adminController.deleteUser(req, res);
      
      expect(User.findById.calledWith(userId)).to.be.true;
      expect(User.findByIdAndDelete.calledWith(userId)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('message', 'User deleted successfully');
    });
    
    it('should not allow deleting own user through admin route', async () => {
      const adminId = 'admin123';
      const mockUser = { 
        _id: adminId, 
        name: 'Admin User',
        email: 'admin@example.com', 
        role: 'admin' 
      };
      
      // Setup request
      req.params.id = adminId;
      
      // Setup mocks
      User.findById.withArgs(adminId).resolves({
        _id: { toString: () => adminId },
        ...mockUser
      });
      
      await adminController.deleteUser(req, res);
      
      expect(User.findById.calledWith(adminId)).to.be.true;
      expect(User.findByIdAndDelete.called).to.be.false;
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('message', 'Cannot delete your own account through admin route');
    });
  });
}); 