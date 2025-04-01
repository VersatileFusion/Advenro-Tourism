const chai = require('chai');
const expect = chai.expect;
const Hotel = require('../../../src/server/models/Hotel');
const mongoose = require('mongoose');

// Load test setup
require('../../config/setup');

describe('Hotel Model', function() {
  this.timeout(5000);
  
  describe('Schema Validation', () => {
    it('should create a valid hotel with all required fields', async () => {
      const hotelData = {
        name: 'Test Hotel',
        description: 'A beautiful test hotel',
        location: 'Test City, Test Country',
        price: 150,
        rating: 4.5,
        amenities: ['WiFi', 'Pool', 'Gym'],
        images: ['image1.jpg', 'image2.jpg']
      };
      
      const hotel = new Hotel(hotelData);
      const savedHotel = await hotel.save();
      
      expect(savedHotel).to.have.property('_id');
      expect(savedHotel.name).to.equal(hotelData.name);
      expect(savedHotel.description).to.equal(hotelData.description);
      expect(savedHotel.location).to.equal(hotelData.location);
      expect(savedHotel.price).to.equal(hotelData.price);
      expect(savedHotel.rating).to.equal(hotelData.rating);
      expect(savedHotel.amenities).to.deep.equal(hotelData.amenities);
      expect(savedHotel.images).to.deep.equal(hotelData.images);
    });
    
    it('should not create a hotel without required fields', async () => {
      const hotel = new Hotel({
        // Missing required fields
      });
      
      try {
        await hotel.save();
        // If save succeeds, test should fail
        expect.fail('Hotel should not be saved without required fields');
      } catch (error) {
        expect(error).to.exist;
        expect(error.name).to.equal('ValidationError');
        // Check for specific validation errors
        expect(error.errors).to.have.property('name');
      }
    });
    
    it('should validate price as a positive number', async () => {
      const hotel = new Hotel({
        name: 'Price Test Hotel',
        description: 'Testing price validation',
        location: 'Test City, Test Country',
        price: -50, // Negative price should fail validation
        rating: 4.0,
        amenities: ['WiFi'],
        images: ['image.jpg']
      });
      
      try {
        await hotel.save();
        // If save succeeds, test should fail
        expect.fail('Hotel should not be saved with negative price');
      } catch (error) {
        expect(error).to.exist;
        expect(error.name).to.equal('ValidationError');
        expect(error.errors).to.have.property('price');
      }
    });
  });
  
  describe('Query Methods', () => {
    // Add hotels for testing queries
    before(async function() {
      this.timeout(10000); // Allow more time for DB operations
      
      // Clear existing hotels to avoid issues with duplicate data
      await Hotel.deleteMany({});
      
      const hotels = [
        {
          name: 'Luxury Hotel',
          description: 'A luxury hotel',
          location: 'Rich City, Moneyland',
          price: 300,
          rating: 5.0,
          amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Bar'],
          images: ['luxury1.jpg', 'luxury2.jpg']
        },
        {
          name: 'Budget Inn',
          description: 'Affordable comfort',
          location: 'Value City, Affordia',
          price: 75,
          rating: 3.5,
          amenities: ['WiFi', 'Free Breakfast'],
          images: ['budget1.jpg']
        },
        {
          name: 'Seaside Resort',
          description: 'Beach vacation paradise',
          location: 'Surf City, Oceanland',
          price: 200,
          rating: 4.7,
          amenities: ['WiFi', 'Pool', 'Beach Access', 'Restaurant'],
          images: ['seaside1.jpg', 'seaside2.jpg', 'seaside3.jpg']
        }
      ];
      
      // Make sure we wait for the inserts to complete
      try {
        const result = await Hotel.insertMany(hotels);
        console.log(`Successfully inserted ${result.length} hotels for testing`);
      } catch (error) {
        console.error('Error inserting test hotels:', error);
        throw error; // Fail the test if we couldn't insert test data
      }
    });
    
    // Clean up after our tests
    after(async function() {
      await Hotel.deleteMany({});
    });
    
    it('should find hotels by price range', async () => {
      const minPrice = 100;
      const maxPrice = 250;
      
      const hotels = await Hotel.find({
        price: { $gte: minPrice, $lte: maxPrice }
      });
      
      expect(hotels).to.be.an('array');
      expect(hotels.length).to.be.at.least(1);
      
      // All returned hotels should be in the price range
      hotels.forEach(hotel => {
        expect(hotel.price).to.be.at.least(minPrice);
        expect(hotel.price).to.be.at.most(maxPrice);
      });
    });
    
    it('should find hotels by amenities', async () => {
      const requiredAmenities = ['WiFi', 'Pool'];
      
      const hotels = await Hotel.find({
        amenities: { $all: requiredAmenities }
      });
      
      expect(hotels).to.be.an('array');
      expect(hotels.length).to.be.at.least(1);
      
      // All returned hotels should have all the required amenities
      hotels.forEach(hotel => {
        requiredAmenities.forEach(amenity => {
          expect(hotel.amenities).to.include(amenity);
        });
      });
    });
    
    it('should sort hotels by rating', async () => {
      const hotels = await Hotel.find({}).sort({ rating: -1 });
      
      expect(hotels).to.be.an('array');
      expect(hotels.length).to.be.at.least(2);
      
      // Check if hotels are sorted by rating in descending order
      for (let i = 0; i < hotels.length - 1; i++) {
        expect(hotels[i].rating).to.be.at.least(hotels[i+1].rating);
      }
    });
  });
}); 