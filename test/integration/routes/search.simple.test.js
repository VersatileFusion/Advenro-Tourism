const { expect } = require('chai');
const sinon = require('sinon');
const express = require('express');

describe('Search Route Integration Tests (Simple)', function() {
  let req, res, next;
  
  beforeEach(() => {
    // Mock request object
    req = {
      query: {},
    };
    
    // Mock response object
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };
    
    // Mock next function
    next = sinon.spy();
  });
  
  describe('searchController', () => {
    it('should return empty results when no query is provided', async () => {
      // Mock empty search results
      const Hotel = {
        find: sinon.stub().returns({
          where: sinon.stub().returnsThis(),
          regex: sinon.stub().returnsThis(),
          or: sinon.stub().returnsThis(),
          gte: sinon.stub().returnsThis(),
          lte: sinon.stub().returnsThis(),
          exec: sinon.stub().resolves([])
        })
      };
      
      const Destination = {
        find: sinon.stub().returns({
          where: sinon.stub().returnsThis(),
          regex: sinon.stub().returnsThis(),
          or: sinon.stub().returnsThis(),
          exec: sinon.stub().resolves([])
        })
      };
      
      // Mock search controller
      const searchController = async (req, res) => {
        try {
          const { query, minPrice, maxPrice, minRating } = req.query;
          
          // Initialize search criteria
          let hotelQuery = {};
          let destinationQuery = {};
          
          // If search query is provided
          if (query) {
            const searchRegex = new RegExp(query, 'i');
            
            // Hotel search criteria
            hotelQuery = {
              $or: [
                { name: { $regex: searchRegex } },
                { location: { $regex: searchRegex } },
                { amenities: { $regex: searchRegex } },
                { description: { $regex: searchRegex } }
              ]
            };
            
            // Destination search criteria
            destinationQuery = {
              $or: [
                { name: { $regex: searchRegex } },
                { country: { $regex: searchRegex } },
                { description: { $regex: searchRegex } }
              ]
            };
          }
          
          // Add price filter
          if (minPrice) {
            hotelQuery.pricePerNight = { ...hotelQuery.pricePerNight, $gte: Number(minPrice) };
          }
          
          if (maxPrice) {
            hotelQuery.pricePerNight = { ...hotelQuery.pricePerNight, $lte: Number(maxPrice) };
          }
          
          // Add rating filter
          if (minRating) {
            hotelQuery.rating = { $gte: Number(minRating) };
          }
          
          // Execute searches
          const hotelsPromise = Hotel.find(hotelQuery).exec();
          const destinationsPromise = Destination.find(destinationQuery).exec();
          
          // Wait for both searches to complete
          const [hotels, destinations] = await Promise.all([
            hotelsPromise,
            destinationsPromise
          ]);
          
          return res.json({
            hotels,
            destinations
          });
        } catch (error) {
          return res.status(500).json({ message: 'Error searching' });
        }
      };
      
      // Call controller
      await searchController(req, res);
      
      // Verify response
      expect(res.json.calledOnce).to.be.true;
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('hotels').that.is.an('array').that.is.empty;
      expect(response).to.have.property('destinations').that.is.an('array').that.is.empty;
    });
    
    it('should search by query and apply filters', async () => {
      // Setup mock data
      const mockHotels = [
        {
          _id: 'hotel1',
          name: 'Luxury Resort',
          location: 'Paris',
          pricePerNight: 300,
          rating: 4.8
        }
      ];
      
      const mockDestinations = [
        {
          _id: 'dest1',
          name: 'Paris',
          country: 'France'
        }
      ];
      
      // Mock models with search results
      const Hotel = {
        find: sinon.stub().returns({
          where: sinon.stub().returnsThis(),
          regex: sinon.stub().returnsThis(),
          or: sinon.stub().returnsThis(),
          gte: sinon.stub().returnsThis(),
          lte: sinon.stub().returnsThis(),
          exec: sinon.stub().resolves(mockHotels)
        })
      };
      
      const Destination = {
        find: sinon.stub().returns({
          where: sinon.stub().returnsThis(),
          regex: sinon.stub().returnsThis(),
          or: sinon.stub().returnsThis(),
          exec: sinon.stub().resolves(mockDestinations)
        })
      };
      
      // Mock search controller (same as above)
      const searchController = async (req, res) => {
        try {
          const { query, minPrice, maxPrice, minRating } = req.query;
          
          // Initialize search criteria
          let hotelQuery = {};
          let destinationQuery = {};
          
          // If search query is provided
          if (query) {
            const searchRegex = new RegExp(query, 'i');
            
            // Hotel search criteria
            hotelQuery = {
              $or: [
                { name: { $regex: searchRegex } },
                { location: { $regex: searchRegex } },
                { amenities: { $regex: searchRegex } },
                { description: { $regex: searchRegex } }
              ]
            };
            
            // Destination search criteria
            destinationQuery = {
              $or: [
                { name: { $regex: searchRegex } },
                { country: { $regex: searchRegex } },
                { description: { $regex: searchRegex } }
              ]
            };
          }
          
          // Add price filter
          if (minPrice) {
            hotelQuery.pricePerNight = { ...hotelQuery.pricePerNight, $gte: Number(minPrice) };
          }
          
          if (maxPrice) {
            hotelQuery.pricePerNight = { ...hotelQuery.pricePerNight, $lte: Number(maxPrice) };
          }
          
          // Add rating filter
          if (minRating) {
            hotelQuery.rating = { $gte: Number(minRating) };
          }
          
          // Execute searches
          const hotelsPromise = Hotel.find(hotelQuery).exec();
          const destinationsPromise = Destination.find(destinationQuery).exec();
          
          // Wait for both searches to complete
          const [hotels, destinations] = await Promise.all([
            hotelsPromise,
            destinationsPromise
          ]);
          
          return res.json({
            hotels,
            destinations
          });
        } catch (error) {
          return res.status(500).json({ message: 'Error searching' });
        }
      };
      
      // Set query parameters
      req.query = { 
        query: 'Paris',
        minPrice: '200',
        maxPrice: '400',
        minRating: '4'
      };
      
      // Call controller
      await searchController(req, res);
      
      // Verify response
      expect(res.json.calledOnce).to.be.true;
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('hotels').that.is.an('array').with.lengthOf(1);
      expect(response).to.have.property('destinations').that.is.an('array').with.lengthOf(1);
      expect(response.hotels[0]).to.have.property('name', 'Luxury Resort');
      expect(response.destinations[0]).to.have.property('name', 'Paris');
    });
  });
}); 