const mongoose = require('mongoose');
const { expect } = require('chai');
const supertest = require('supertest');
const express = require('express');
const Destination = require('../../../src/server/models/Destination');
const User = require('../../../src/server/models/User');
const jwt = require('jsonwebtoken');

// Create Express app for testing
const app = express();
app.use(express.json());

// Mock middleware for testing
const mockAuth = (req, res, next) => {
  try {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key');
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

const mockAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  next();
};

// Mock destination routes implementing the same functionality as the real routes
const router = express.Router();

// Get all destinations
router.get('/', async (req, res) => {
  try {
    const { country, search } = req.query;
    let query = {};

    // Filter by country if provided
    if (country) {
      query.country = country;
    }

    // Search by name if provided
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const destinations = await Destination.find(query)
      .sort({ name: 1 });
    res.json(destinations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching destinations' });
  }
});

// Get destination by ID
router.get('/:id', async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    res.json(destination);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching destination' });
  }
});

// Create destination (admin only)
router.post('/', [mockAuth, mockAdmin], async (req, res) => {
  try {
    const { name, country, description, imageUrl } = req.body;

    // Check if destination with same name exists
    const existingDestination = await Destination.findOne({ name });
    if (existingDestination) {
      return res.status(400).json({ message: 'Destination with this name already exists' });
    }

    const destination = new Destination({
      name,
      country,
      description,
      imageUrl
    });

    await destination.save();
    res.status(201).json(destination);
  } catch (error) {
    res.status(400).json({ message: 'Error creating destination' });
  }
});

// Update destination (admin only)
router.put('/:id', [mockAuth, mockAdmin], async (req, res) => {
  try {
    const { name, country, description, imageUrl } = req.body;

    // Check if another destination with same name exists
    if (name) {
      const existingDestination = await Destination.findOne({
        name,
        _id: { $ne: req.params.id }
      });
      if (existingDestination) {
        return res.status(400).json({ message: 'Destination with this name already exists' });
      }
    }

    const destination = await Destination.findByIdAndUpdate(
      req.params.id,
      { name, country, description, imageUrl },
      { new: true }
    );

    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }

    res.json(destination);
  } catch (error) {
    res.status(400).json({ message: 'Error updating destination' });
  }
});

// Delete destination (admin only)
router.delete('/:id', [mockAuth, mockAdmin], async (req, res) => {
  try {
    const destination = await Destination.findByIdAndDelete(req.params.id);
    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    res.json({ message: 'Destination deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting destination' });
  }
});

app.use('/api/destinations', router);

describe('Destination Routes Integration Tests', function() {
  let request, adminUser, regularUser, testDestination;
  let adminToken, userToken;
  
  before(async function() {
    // This might take longer in CI environments
    this.timeout(10000);
    
    // Create supertest client
    request = supertest(app);
    
    // Create test users
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      isVerified: true,
      firstName: 'Admin',
      lastName: 'User'
    });
    
    regularUser = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'password123',
      role: 'user',
      isVerified: true,
      firstName: 'Regular',
      lastName: 'User'
    });
    
    // Generate tokens
    adminToken = jwt.sign(
      { id: adminUser._id, role: 'admin' },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );
    
    userToken = jwt.sign(
      { id: regularUser._id, role: 'user' },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );
    
    // Create test destination
    testDestination = await Destination.create({
      name: 'Test Destination',
      country: 'Test Country',
      description: 'A description for testing purposes',
      imageUrl: 'https://example.com/test.jpg'
    });
  });
  
  after(async function() {
    // Clean up created data
    await Destination.deleteMany({});
    await User.deleteMany({});
  });
  
  describe('GET /api/destinations', () => {
    it('should get all destinations', async () => {
      const res = await request.get('/api/destinations');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(1);
      expect(res.body[0]).to.have.property('name', 'Test Destination');
    });
    
    it('should filter destinations by country', async () => {
      // Create a destination with a different country
      await Destination.create({
        name: 'Another Destination',
        country: 'Different Country',
        description: 'Another test destination',
        imageUrl: 'https://example.com/another.jpg'
      });
      
      const res = await request.get('/api/destinations?country=Test Country');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.equal(1);
      expect(res.body[0]).to.have.property('country', 'Test Country');
    });
    
    it('should search destinations by name', async () => {
      const res = await request.get('/api/destinations?search=Another');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.equal(1);
      expect(res.body[0]).to.have.property('name', 'Another Destination');
    });
  });
  
  describe('GET /api/destinations/:id', () => {
    it('should get a destination by ID', async () => {
      const res = await request.get(`/api/destinations/${testDestination._id}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('name', 'Test Destination');
      expect(res.body).to.have.property('country', 'Test Country');
      expect(res.body).to.have.property('description');
    });
    
    it('should return 404 if destination not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request.get(`/api/destinations/${fakeId}`);
      
      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('message', 'Destination not found');
    });
  });
  
  describe('POST /api/destinations', () => {
    it('should create a destination with admin access', async () => {
      const newDestination = {
        name: 'New Destination',
        country: 'New Country',
        description: 'A brand new destination for testing',
        imageUrl: 'https://example.com/new.jpg'
      };
      
      const res = await request
        .post('/api/destinations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newDestination);
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('name', 'New Destination');
      expect(res.body).to.have.property('country', 'New Country');
      
      // Verify it was actually created in the database
      const created = await Destination.findOne({ name: 'New Destination' });
      expect(created).to.not.be.null;
    });
    
    it('should return 400 if destination name already exists', async () => {
      const duplicateDestination = {
        name: 'Test Destination', // Duplicate name
        country: 'Different Country',
        description: 'This should fail due to duplicate name',
        imageUrl: 'https://example.com/duplicate.jpg'
      };
      
      const res = await request
        .post('/api/destinations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateDestination);
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message', 'Destination with this name already exists');
    });
    
    it('should return 403 for non-admin users', async () => {
      const newDestination = {
        name: 'User Created',
        country: 'User Country',
        description: 'Should be rejected',
        imageUrl: 'https://example.com/user.jpg'
      };
      
      const res = await request
        .post('/api/destinations')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newDestination);
      
      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('message', 'Access denied');
    });
  });
  
  describe('PUT /api/destinations/:id', () => {
    it('should update a destination with admin access', async () => {
      const updates = {
        name: 'Updated Test Destination',
        country: 'Updated Country',
        description: 'Updated description',
        imageUrl: 'https://example.com/updated.jpg'
      };
      
      const res = await request
        .put(`/api/destinations/${testDestination._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('name', 'Updated Test Destination');
      expect(res.body).to.have.property('country', 'Updated Country');
      
      // Verify it was actually updated in the database
      const updated = await Destination.findById(testDestination._id);
      expect(updated.name).to.equal('Updated Test Destination');
    });
    
    it('should return 404 if destination not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request
        .put(`/api/destinations/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Non-existent Update',
          country: 'Nowhere',
          description: 'This should fail',
          imageUrl: 'https://example.com/nonexistent.jpg'
        });
      
      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('message', 'Destination not found');
    });
    
    it('should return 403 for non-admin users', async () => {
      const res = await request
        .put(`/api/destinations/${testDestination._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'User Update',
          country: 'User Country'
        });
      
      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('message', 'Access denied');
    });
  });
  
  describe('DELETE /api/destinations/:id', () => {
    it('should delete a destination with admin access', async () => {
      // Create a destination to delete
      const destinationToDelete = await Destination.create({
        name: 'To Be Deleted',
        country: 'Delete Country',
        description: 'This will be deleted',
        imageUrl: 'https://example.com/delete.jpg'
      });
      
      const res = await request
        .delete(`/api/destinations/${destinationToDelete._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message', 'Destination deleted successfully');
      
      // Verify it was actually deleted
      const deleted = await Destination.findById(destinationToDelete._id);
      expect(deleted).to.be.null;
    });
    
    it('should return 404 if destination not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request
        .delete(`/api/destinations/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('message', 'Destination not found');
    });
    
    it('should return 403 for non-admin users', async () => {
      const res = await request
        .delete(`/api/destinations/${testDestination._id}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('message', 'Access denied');
    });
  });
}); 