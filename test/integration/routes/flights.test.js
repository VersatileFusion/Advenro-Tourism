const chai = require('chai');
const expect = chai.expect;
const { getRequest, postRequest, putRequest, deleteRequest } = require('../../helpers/request-helper');
const { createUserWithToken, createAdminWithToken } = require('../../helpers/auth-helper');
const Flight = require('../../../src/models/Flight');
const mongoose = require('mongoose');

// Load test setup
require('../../config/setup');

describe('Flights Routes', function() {
  this.timeout(10000);
  
  let userToken, adminToken;
  let testFlightId;
  
  const testFlight = {
    flightNumber: 'TF123',
    airline: 'Test Airways',
    departureCity: 'New York',
    arrivalCity: 'London',
    departureTime: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
    arrivalTime: new Date(Date.now() + 7*24*60*60*1000 + 8*60*60*1000).toISOString(),
    departureAirport: 'JFK',
    arrivalAirport: 'LHR',
    price: {
      economy: 500,
      business: 1500,
      first: 3000
    },
    availableSeats: {
      economy: 100,
      business: 20,
      first: 10
    },
    aircraft: 'Boeing 777'
  };
  
  // Create users and test flight before tests
  before(async () => {
    // Create normal user with token
    const user = await createUserWithToken();
    userToken = user.token;
    
    // Create admin user with token
    const admin = await createAdminWithToken();
    adminToken = admin.token;
    
    // Create a test flight for testing GET, PUT, DELETE
    const flight = new Flight(testFlight);
    const savedFlight = await flight.save();
    testFlightId = savedFlight._id.toString();
  });
  
  describe('GET /flights', () => {
    it('should get all flights', async () => {
      const res = await getRequest('/flights');
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.be.at.least(1);
      
      // Check if the test flight is in the response
      const testFlightExists = res.body.data.some(flight => flight.flightNumber === testFlight.flightNumber);
      expect(testFlightExists).to.be.true;
    });
    
    it('should filter flights by departure city', async () => {
      const departureCity = 'New York';
      
      const res = await getRequest(`/flights?departureCity=${departureCity}`);
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
      
      // All returned flights should have the specified departure city
      res.body.data.forEach(flight => {
        expect(flight.departureCity).to.include(departureCity);
      });
    });
    
    it('should filter flights by arrival city', async () => {
      const arrivalCity = 'London';
      
      const res = await getRequest(`/flights?arrivalCity=${arrivalCity}`);
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
      
      // All returned flights should have the specified arrival city
      res.body.data.forEach(flight => {
        expect(flight.arrivalCity).to.include(arrivalCity);
      });
    });
    
    it('should filter flights by price range', async () => {
      const minPrice = 400;
      const maxPrice = 600;
      const flightClass = 'economy';
      
      const res = await getRequest(`/flights?minPrice=${minPrice}&maxPrice=${maxPrice}&class=${flightClass}`);
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
      
      // All returned flights should be within the price range for the specified class
      res.body.data.forEach(flight => {
        expect(flight.price[flightClass]).to.be.at.least(minPrice);
        expect(flight.price[flightClass]).to.be.at.most(maxPrice);
      });
    });
  });
  
  describe('GET /flights/search', () => {
    it('should search for flights with required parameters', async () => {
      const from = 'New York';
      const to = 'London';
      const date = new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0];
      
      const res = await getRequest(`/flights/search?from=${from}&to=${to}&date=${date}&passengers=2&class=economy`);
      
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
    });
    
    it('should return 400 when required parameters are missing', async () => {
      const res = await getRequest('/flights/search?from=New%20York');
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message');
    });
  });
  
  describe('GET /flights/:id', () => {
    it('should get a flight by ID', async () => {
      const res = await getRequest(`/flights/${testFlightId}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object');
      expect(res.body.data).to.be.an('object');
      expect(res.body.data._id).to.equal(testFlightId);
      expect(res.body.data.flightNumber).to.equal(testFlight.flightNumber);
      expect(res.body.data.airline).to.equal(testFlight.airline);
      expect(res.body.data.departureCity).to.equal(testFlight.departureCity);
      expect(res.body.data.arrivalCity).to.equal(testFlight.arrivalCity);
    });
    
    it('should return 404 for non-existent flight ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      const res = await getRequest(`/flights/${nonExistentId}`);
      
      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('message');
    });
    
    it('should return 400 for invalid flight ID format', async () => {
      const invalidId = 'invalid-id-format';
      
      const res = await getRequest(`/flights/${invalidId}`);
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message');
    });
  });
  
  describe('POST /flights', () => {
    it('should create a new flight when authenticated as admin', async () => {
      const newFlight = {
        flightNumber: 'NF456',
        airline: 'New Test Airways',
        departureCity: 'Paris',
        arrivalCity: 'Rome',
        departureTime: new Date(Date.now() + 14*24*60*60*1000).toISOString(),
        arrivalTime: new Date(Date.now() + 14*24*60*60*1000 + 2*60*60*1000).toISOString(),
        departureAirport: 'CDG',
        arrivalAirport: 'FCO',
        price: {
          economy: 300,
          business: 900,
          first: 1800
        },
        availableSeats: {
          economy: 150,
          business: 30,
          first: 10
        },
        aircraft: 'Airbus A320'
      };
      
      const res = await postRequest('/flights', newFlight, adminToken);
      
      expect(res.status).to.equal(201);
      expect(res.body).to.be.an('object');
      expect(res.body.data).to.be.an('object');
      expect(res.body.data).to.have.property('_id');
      expect(res.body.data.flightNumber).to.equal(newFlight.flightNumber);
      expect(res.body.data.airline).to.equal(newFlight.airline);
      expect(res.body.data.departureCity).to.equal(newFlight.departureCity);
      expect(res.body.data.arrivalCity).to.equal(newFlight.arrivalCity);
      
      // Save the ID for cleanup
      const createdFlightId = res.body.data._id;
      after(async () => {
        await Flight.findByIdAndDelete(createdFlightId);
      });
    });
    
    it('should not create a flight without authentication', async () => {
      const newFlight = {
        flightNumber: 'UF789',
        airline: 'Unauthorized Airways',
        departureCity: 'Madrid',
        arrivalCity: 'Berlin'
      };
      
      const res = await postRequest('/flights', newFlight);
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message');
    });
    
    it('should not allow regular user to create flight', async () => {
      const newFlight = {
        flightNumber: 'RF789',
        airline: 'Regular User Airways',
        departureCity: 'Madrid',
        arrivalCity: 'Berlin'
      };
      
      const res = await postRequest('/flights', newFlight, userToken);
      
      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('message');
    });
  });
  
  describe('PUT /flights/:id', () => {
    it('should update a flight when authenticated as admin', async () => {
      const updates = {
        airline: 'Updated Airways',
        price: {
          economy: 550,
          business: 1600,
          first: 3200
        }
      };
      
      const res = await putRequest(`/flights/${testFlightId}`, updates, adminToken);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object');
      expect(res.body.data).to.be.an('object');
      expect(res.body.data._id).to.equal(testFlightId);
      expect(res.body.data.airline).to.equal(updates.airline);
      expect(res.body.data.price.economy).to.equal(updates.price.economy);
    });
    
    it('should not update flight without authentication', async () => {
      const updates = {
        airline: 'Unauthorized Update'
      };
      
      const res = await putRequest(`/flights/${testFlightId}`, updates);
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message');
    });
  });
  
  describe('DELETE /flights/:id', () => {
    // Create a flight to delete
    let flightToDeleteId;
    
    before(async () => {
      const flightToDelete = new Flight({
        flightNumber: 'DF001',
        airline: 'Delete Airways',
        departureCity: 'Sydney',
        arrivalCity: 'Tokyo',
        departureTime: new Date(Date.now() + 10*24*60*60*1000).toISOString(),
        arrivalTime: new Date(Date.now() + 10*24*60*60*1000 + 10*60*60*1000).toISOString(),
        departureAirport: 'SYD',
        arrivalAirport: 'HND',
        price: {
          economy: 700
        },
        availableSeats: {
          economy: 200
        }
      });
      
      const savedFlight = await flightToDelete.save();
      flightToDeleteId = savedFlight._id.toString();
    });
    
    it('should not delete flight without authentication', async () => {
      const res = await deleteRequest(`/flights/${flightToDeleteId}`);
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message');
      
      // Verify flight still exists
      const flightExists = await Flight.findById(flightToDeleteId);
      expect(flightExists).to.not.be.null;
    });
    
    it('should not allow regular user to delete flight', async () => {
      const res = await deleteRequest(`/flights/${flightToDeleteId}`, userToken);
      
      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('message');
      
      // Verify flight still exists
      const flightExists = await Flight.findById(flightToDeleteId);
      expect(flightExists).to.not.be.null;
    });
    
    it('should delete a flight when authenticated as admin', async () => {
      const res = await deleteRequest(`/flights/${flightToDeleteId}`, adminToken);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message');
      
      // Verify flight no longer exists
      const flightExists = await Flight.findById(flightToDeleteId);
      expect(flightExists).to.be.null;
    });
  });
}); 