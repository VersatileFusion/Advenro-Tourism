const { expect } = require('chai');
const express = require('express');
const supertest = require('supertest');
const bodyParser = require('body-parser');

describe('API Routes', () => {
  let app, request;
  
  before(() => {
    // Create a simple Express app
    app = express();
    app.use(bodyParser.json());
    
    // Setup auth routes
    const authRouter = express.Router();
    
    authRouter.post('/login', (req, res) => {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      if (email === 'test@example.com' && password === 'password123') {
        return res.status(200).json({ 
          token: 'mock-token',
          user: { id: 'user123', email, name: 'Test User' }
        });
      }
      
      return res.status(401).json({ message: 'Invalid credentials' });
    });
    
    authRouter.post('/register', (req, res) => {
      const { name, email, password } = req.body;
      
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required' });
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      
      // Password validation
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      
      return res.status(201).json({ 
        message: 'User registered successfully',
        user: { id: 'new-user-123', name, email }
      });
    });
    
    // Setup hotel routes
    const hotelRouter = express.Router();
    
    hotelRouter.get('/', (req, res) => {
      const hotels = [
        { id: 'hotel1', name: 'Luxury Hotel', location: 'Paris' },
        { id: 'hotel2', name: 'Beach Resort', location: 'Miami' }
      ];
      
      return res.status(200).json({ hotels });
    });
    
    hotelRouter.get('/:id', (req, res) => {
      const { id } = req.params;
      
      if (id === 'hotel1') {
        return res.status(200).json({ 
          hotel: { 
            id: 'hotel1', 
            name: 'Luxury Hotel', 
            location: 'Paris',
            description: 'A 5-star hotel in the heart of Paris',
            price: 250,
            rating: 4.8
          }
        });
      }
      
      return res.status(404).json({ message: 'Hotel not found' });
    });
    
    // Setup booking routes with auth middleware
    const bookingRouter = express.Router();
    
    // Auth middleware for booking routes
    const authMiddleware = (req, res, next) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }
      
      const token = authHeader.split(' ')[1];
      
      if (token === 'valid-token') {
        req.user = { id: 'user123', email: 'test@example.com' };
        return next();
      }
      
      return res.status(401).json({ message: 'Invalid token' });
    };
    
    bookingRouter.use(authMiddleware);
    
    bookingRouter.post('/', (req, res) => {
      const { hotelId, checkInDate, checkOutDate, guests } = req.body;
      
      if (!hotelId || !checkInDate || !checkOutDate || !guests) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      return res.status(201).json({
        booking: {
          id: 'booking123',
          hotelId,
          userId: req.user.id,
          checkInDate,
          checkOutDate,
          guests,
          totalPrice: 500,
          status: 'confirmed'
        }
      });
    });
    
    // Register routes
    app.use('/api/auth', authRouter);
    app.use('/api/hotels', hotelRouter);
    app.use('/api/bookings', bookingRouter);
    
    // Error handler
    app.use((err, req, res, next) => {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    });
    
    // Create supertest client
    request = supertest(app);
  });
  
  describe('Auth Routes', () => {
    it('should login a user with valid credentials', async () => {
      const res = await request
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
      expect(res.body).to.have.property('user');
      expect(res.body.user).to.have.property('email', 'test@example.com');
    });
    
    it('should reject login with invalid credentials', async () => {
      const res = await request
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message', 'Invalid credentials');
    });
    
    it('should register a new user with valid data', async () => {
      const res = await request
        .post('/api/auth/register')
        .send({ 
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123'
        });
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('message', 'User registered successfully');
      expect(res.body).to.have.property('user');
      expect(res.body.user).to.have.property('email', 'newuser@example.com');
    });
    
    it('should reject registration with invalid email', async () => {
      const res = await request
        .post('/api/auth/register')
        .send({ 
          name: 'New User',
          email: 'invalid-email',
          password: 'password123'
        });
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message', 'Invalid email format');
    });
    
    it('should reject registration with short password', async () => {
      const res = await request
        .post('/api/auth/register')
        .send({ 
          name: 'New User',
          email: 'newuser@example.com',
          password: '123'
        });
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message', 'Password must be at least 6 characters');
    });
  });
  
  describe('Hotel Routes', () => {
    it('should get list of hotels', async () => {
      const res = await request.get('/api/hotels');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('hotels');
      expect(res.body.hotels).to.be.an('array');
      expect(res.body.hotels).to.have.lengthOf(2);
    });
    
    it('should get hotel details by ID', async () => {
      const res = await request.get('/api/hotels/hotel1');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('hotel');
      expect(res.body.hotel).to.have.property('id', 'hotel1');
      expect(res.body.hotel).to.have.property('name', 'Luxury Hotel');
    });
    
    it('should return 404 for non-existent hotel', async () => {
      const res = await request.get('/api/hotels/nonexistent');
      
      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('message', 'Hotel not found');
    });
  });
  
  describe('Booking Routes', () => {
    it('should reject booking without authentication', async () => {
      const res = await request
        .post('/api/bookings')
        .send({
          hotelId: 'hotel1',
          checkInDate: '2023-06-15',
          checkOutDate: '2023-06-20',
          guests: 2
        });
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message', 'No token provided');
    });
    
    it('should create booking with valid authentication', async () => {
      const res = await request
        .post('/api/bookings')
        .set('Authorization', 'Bearer valid-token')
        .send({
          hotelId: 'hotel1',
          checkInDate: '2023-06-15',
          checkOutDate: '2023-06-20',
          guests: 2
        });
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('booking');
      expect(res.body.booking).to.have.property('hotelId', 'hotel1');
      expect(res.body.booking).to.have.property('status', 'confirmed');
    });
    
    it('should reject booking with missing fields', async () => {
      const res = await request
        .post('/api/bookings')
        .set('Authorization', 'Bearer valid-token')
        .send({
          // Missing required fields
          hotelId: 'hotel1'
        });
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message', 'Missing required fields');
    });
  });
}); 