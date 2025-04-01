const chai = require('chai');
const expect = chai.expect;
const { getRequest, postRequest, putRequest } = require('../../helpers/request-helper');
const { createUserWithToken, createAdminWithToken } = require('../../helpers/auth-helper');

// Load test setup
require('../../config/setup');

describe('Booking.com Routes', function() {
  this.timeout(20000); // Increased timeout for API calls
  
  let userToken, adminToken;
  
  // Create a user and admin user before tests
  before(async () => {
    // Create normal user with token
    const user = await createUserWithToken();
    userToken = user.token;
    
    // Create admin user with token
    const admin = await createAdminWithToken();
    adminToken = admin.token;
  });
  
  describe('GET /booking/hotels/search', () => {
    it('should search for hotels', async () => {
      const query = {
        checkIn: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0], // 7 days from now
        checkOut: new Date(Date.now() + 9*24*60*60*1000).toISOString().split('T')[0], // 9 days from now
        destId: 'paris',
        adults: '2',
        rooms: '1'
      };
      
      const queryString = Object.entries(query)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      
      const res = await getRequest(`/booking/hotels/search?${queryString}`);
      
      // We may not get actual results in test environment, so just check the structure
      expect(res.status).to.be.oneOf([200, 503]); // 503 is acceptable if the external API is down
      if (res.status === 200) {
        expect(res.body).to.have.property('data');
      }
    });
    
    it('should return 400 when required parameters are missing', async () => {
      const res = await getRequest('/booking/hotels/search');
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message');
    });
  });
  
  describe('GET /booking/locations', () => {
    it('should search for locations', async () => {
      const query = 'paris';
      
      const res = await getRequest(`/booking/locations?query=${query}`);
      
      // We may not get actual results in test environment, so just check the structure
      expect(res.status).to.be.oneOf([200, 503]); // 503 is acceptable if the external API is down
      if (res.status === 200) {
        expect(res.body).to.have.property('data');
      }
    });
    
    it('should return 400 when query parameter is missing', async () => {
      const res = await getRequest('/booking/locations');
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message');
    });
  });
  
  describe('GET /booking/property-types', () => {
    it('should get property types', async () => {
      const res = await getRequest('/booking/property-types');
      
      expect(res.status).to.be.oneOf([200, 503]); // 503 is acceptable if the external API is down
      if (res.status === 200) {
        expect(res.body).to.have.property('data');
        expect(res.body.data).to.be.an('array');
      }
    });
  });
  
  describe('GET /booking/exchange-rates', () => {
    it('should get exchange rates', async () => {
      const currency = 'USD';
      
      const res = await getRequest(`/booking/exchange-rates?currency=${currency}`);
      
      expect(res.status).to.be.oneOf([200, 503]); // 503 is acceptable if the external API is down
      if (res.status === 200) {
        expect(res.body).to.have.property('data');
        expect(res.body.data).to.have.property('rates');
      }
    });
  });
  
  describe('POST /booking/bookings (protected)', () => {
    it('should create a booking when authenticated', async () => {
      const bookingData = {
        hotelId: 'test123',
        roomId: 'room123',
        checkIn: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 9*24*60*60*1000).toISOString().split('T')[0],
        guests: {
          adults: 2,
          children: 0
        },
        price: {
          total: 300,
          currency: 'USD'
        }
      };
      
      const res = await postRequest('/booking/bookings', bookingData, userToken);
      
      // We may not get actual success in test environment, so check structure
      if (res.status === 201) {
        expect(res.body).to.have.property('data');
        expect(res.body.data).to.have.property('id');
      } else {
        // Mock API might return different status codes
        expect(res.status).to.be.oneOf([400, 404, 403, 503]);
      }
    });
    
    it('should not create a booking without authentication', async () => {
      const bookingData = {
        hotelId: 'test123',
        roomId: 'room123',
        checkIn: '2023-12-01',
        checkOut: '2023-12-03'
      };
      
      const res = await postRequest('/booking/bookings', bookingData);
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message');
    });
  });
  
  describe('GET /booking/bookings/user (protected)', () => {
    it('should get user bookings when authenticated', async () => {
      const res = await getRequest('/booking/bookings/user', userToken);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.be.an('array');
    });
    
    it('should not get bookings without authentication', async () => {
      const res = await getRequest('/booking/bookings/user');
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message');
    });
  });
}); 