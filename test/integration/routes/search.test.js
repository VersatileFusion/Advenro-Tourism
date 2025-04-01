const { expect } = require('chai');
const supertest = require('supertest');
const express = require('express');
const Hotel = require('../../../src/server/models/Hotel');
const Destination = require('../../../src/server/models/Destination');
const searchRoutes = require('../../../src/server/routes/search');

describe('Search Routes Integration Tests', function() {
  let app, request, testHotels, testDestinations;
  
  before(async function() {
    // This might take longer in CI environments
    this.timeout(10000);
    
    // Create Express app for testing
    app = express();
    app.use(express.json());
    
    // Use search routes
    app.use('/api/search', searchRoutes);
    
    // Create supertest client
    request = supertest(app);
    
    // Create test hotels
    testHotels = await Hotel.create([
      {
        name: 'Luxury Resort',
        location: 'Paris, France',
        description: 'A luxury resort in the heart of Paris',
        pricePerNight: 300,
        amenities: ['Pool', 'Spa', 'WiFi', 'Restaurant'],
        rating: 4.8,
        imageUrl: 'https://example.com/luxury.jpg'
      },
      {
        name: 'Budget Inn',
        location: 'Paris, France',
        description: 'An affordable option in Paris',
        pricePerNight: 100,
        amenities: ['WiFi', 'Breakfast'],
        rating: 3.5,
        imageUrl: 'https://example.com/budget.jpg'
      },
      {
        name: 'Mountain Retreat',
        location: 'Alps, Switzerland',
        description: 'A peaceful retreat in the Swiss Alps',
        pricePerNight: 250,
        amenities: ['Hiking', 'Spa', 'Restaurant'],
        rating: 4.6,
        imageUrl: 'https://example.com/mountain.jpg'
      }
    ]);
    
    // Create test destinations
    testDestinations = await Destination.create([
      {
        name: 'Paris',
        country: 'France',
        description: 'The city of love and lights',
        imageUrl: 'https://example.com/paris.jpg'
      },
      {
        name: 'Swiss Alps',
        country: 'Switzerland',
        description: 'Beautiful mountain ranges',
        imageUrl: 'https://example.com/alps.jpg'
      },
      {
        name: 'Barcelona',
        country: 'Spain',
        description: 'Vibrant city with stunning architecture',
        imageUrl: 'https://example.com/barcelona.jpg'
      }
    ]);
  });
  
  after(async function() {
    // Clean up created data
    await Hotel.deleteMany({});
    await Destination.deleteMany({});
  });
  
  describe('GET /api/search', () => {
    it('should return empty results when no query is provided', async () => {
      const res = await request.get('/api/search');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('hotels').that.is.an('array').that.is.empty;
      expect(res.body).to.have.property('destinations').that.is.an('array').that.is.empty;
    });
    
    it('should search hotels by name', async () => {
      const res = await request.get('/api/search?query=Luxury');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('hotels').that.is.an('array');
      expect(res.body.hotels.length).to.equal(1);
      expect(res.body.hotels[0]).to.have.property('name', 'Luxury Resort');
    });
    
    it('should search hotels by location', async () => {
      const res = await request.get('/api/search?query=Paris');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('hotels').that.is.an('array');
      expect(res.body.hotels.length).to.equal(2);
      expect(res.body.hotels.some(hotel => hotel.name === 'Luxury Resort')).to.be.true;
      expect(res.body.hotels.some(hotel => hotel.name === 'Budget Inn')).to.be.true;
    });
    
    it('should search hotels by amenities', async () => {
      const res = await request.get('/api/search?query=Spa');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('hotels').that.is.an('array');
      expect(res.body.hotels.length).to.equal(2);
      expect(res.body.hotels.some(hotel => hotel.name === 'Luxury Resort')).to.be.true;
      expect(res.body.hotels.some(hotel => hotel.name === 'Mountain Retreat')).to.be.true;
    });
    
    it('should search destinations by name', async () => {
      const res = await request.get('/api/search?query=Paris');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('destinations').that.is.an('array');
      expect(res.body.destinations.length).to.equal(1);
      expect(res.body.destinations[0]).to.have.property('name', 'Paris');
    });
    
    it('should search destinations by country', async () => {
      const res = await request.get('/api/search?query=Switzerland');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('destinations').that.is.an('array');
      expect(res.body.destinations.length).to.equal(1);
      expect(res.body.destinations[0]).to.have.property('name', 'Swiss Alps');
    });
    
    it('should filter hotels by price range', async () => {
      const res = await request.get('/api/search?query=Paris&minPrice=200&maxPrice=400');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('hotels').that.is.an('array');
      expect(res.body.hotels.length).to.equal(1);
      expect(res.body.hotels[0]).to.have.property('name', 'Luxury Resort');
    });
    
    it('should filter hotels by rating', async () => {
      const res = await request.get('/api/search?query=&minRating=4.7');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('hotels').that.is.an('array');
      expect(res.body.hotels.length).to.equal(1);
      expect(res.body.hotels[0]).to.have.property('name', 'Luxury Resort');
    });
    
    it('should combine filters for complex searches', async () => {
      const res = await request.get('/api/search?query=Paris&minPrice=50&maxPrice=150&minRating=3');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('hotels').that.is.an('array');
      expect(res.body.hotels.length).to.equal(1);
      expect(res.body.hotels[0]).to.have.property('name', 'Budget Inn');
    });
    
    it('should search across multiple entities', async () => {
      const res = await request.get('/api/search?query=Switzerland');
      
      expect(res.status).to.equal(200);
      
      // Should find both the Swiss Alps destination and the Mountain Retreat hotel
      expect(res.body).to.have.property('hotels').that.is.an('array');
      expect(res.body).to.have.property('destinations').that.is.an('array');
      
      expect(res.body.hotels.length).to.equal(1);
      expect(res.body.destinations.length).to.equal(1);
      
      expect(res.body.hotels[0]).to.have.property('name', 'Mountain Retreat');
      expect(res.body.destinations[0]).to.have.property('name', 'Swiss Alps');
    });
  });
}); 