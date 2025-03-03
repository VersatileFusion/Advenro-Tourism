const request = require('supertest');
const app = require('../server');
const bookingComService = require('../services/bookingComService');
const { expect } = require('chai');
const sinon = require('sinon');

describe('Booking.com API', () => {
    describe('Hotel Chains', () => {
        it('should list hotel chains with pagination', async () => {
            const res = await request(app)
                .get('/api/v1/booking/chains')
                .query({ page: '0', limit: '10' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should get hotel chain details', async () => {
            const chainId = 'test-chain-id';
            const res = await request(app)
                .get(`/api/v1/booking/chains/${chainId}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('name');
        });
    });

    describe('Room Types and Amenities', () => {
        it('should get room types for a hotel', async () => {
            const hotelId = 'test-hotel-id';
            const res = await request(app)
                .get(`/api/v1/booking/hotels/${hotelId}/room-types`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should get hotel amenities', async () => {
            const hotelId = 'test-hotel-id';
            const res = await request(app)
                .get(`/api/v1/booking/hotels/${hotelId}/amenities`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should get hotel sustainability practices', async () => {
            const hotelId = 'test-hotel-id';
            const res = await request(app)
                .get(`/api/v1/booking/hotels/${hotelId}/sustainability`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('practices');
        });
    });

    describe('Rate Limiting', () => {
        it('should limit search requests', async () => {
            // Make more requests than the limit allows
            const requests = Array(101).fill().map(() =>
                request(app).get('/api/v1/booking/hotels/search')
                    .query({
                        checkIn: '2024-05-01',
                        checkOut: '2024-05-05',
                        destId: 'test-dest'
                    })
            );

            const responses = await Promise.all(requests);
            const tooManyRequests = responses.some(res => res.status === 429);
            expect(tooManyRequests).toBe(true);
        });
    });

    describe('Caching', () => {
        beforeEach(() => {
            // Clear cache before each test
            bookingComService.clearCache();
        });

        it('should cache and return cached results', async () => {
            const hotelId = 'test-hotel-id';

            // First request should hit the API
            const res1 = await request(app)
                .get(`/api/v1/booking/hotels/${hotelId}/amenities`);
            expect(res1.status).toBe(200);

            // Mock the service to track API calls
            const spy = jest.spyOn(bookingComService.apiClient, 'get');

            // Second request should use cache
            const res2 = await request(app)
                .get(`/api/v1/booking/hotels/${hotelId}/amenities`);
            expect(res2.status).toBe(200);
            expect(spy).not.toHaveBeenCalled();

            spy.mockRestore();
        });

        it('should clear cache with pattern', async () => {
            const token = 'test-admin-token';
            const res = await request(app)
                .delete('/api/v1/booking/cache')
                .query({ pattern: 'amenities_' })
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid hotel ID', async () => {
            const res = await request(app)
                .get('/api/v1/booking/hotels/invalid-id/amenities');

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('should handle missing required parameters', async () => {
            const res = await request(app)
                .get('/api/v1/booking/hotels/search');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should handle API errors gracefully', async () => {
            // Mock API error
            jest.spyOn(bookingComService.apiClient, 'get')
                .mockRejectedValueOnce(new Error('API Error'));

            const res = await request(app)
                .get('/api/v1/booking/hotels/test-id/amenities');

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
        });
    });

    describe('Hotel Score', () => {
        it('should get hotel score breakdown', async () => {
            const hotelId = 'test_hotel_1';
            const res = await request(app)
                .get(`/api/v1/booking/hotels/${hotelId}/score`)
                .expect(200);

            expect(res.body.success).to.be.true;
            expect(res.body.data).to.have.property('overall');
            expect(res.body.data).to.have.property('cleanliness');
            expect(res.body.data).to.have.property('location');
            expect(res.body.data).to.have.property('staff');
            expect(res.body.data).to.have.property('value');
        });

        it('should handle invalid hotel ID for score', async () => {
            const res = await request(app)
                .get('/api/v1/booking/hotels/invalid_id/score')
                .expect(404);

            expect(res.body.success).to.be.false;
            expect(res.body).to.have.property('error');
        });
    });

    describe('Payment Options', () => {
        it('should get hotel payment options', async () => {
            const hotelId = 'test_hotel_1';
            const res = await request(app)
                .get(`/api/v1/booking/hotels/${hotelId}/payment-options`)
                .expect(200);

            expect(res.body.success).to.be.true;
            expect(res.body.data).to.have.property('methods').that.is.an('array');
            expect(res.body.data).to.have.property('policies').that.is.an('object');
        });
    });

    describe('Accessibility Features', () => {
        it('should get hotel accessibility features', async () => {
            const hotelId = 'test_hotel_1';
            const res = await request(app)
                .get(`/api/v1/booking/hotels/${hotelId}/accessibility`)
                .expect(200);

            expect(res.body.success).to.be.true;
            expect(res.body.data).to.have.property('features').that.is.an('array');
            res.body.data.features.forEach(feature => {
                expect(feature).to.have.property('name');
                expect(feature).to.have.property('description');
            });
        });
    });

    describe('Similar Hotels', () => {
        it('should get similar hotels recommendations', async () => {
            const hotelId = 'test_hotel_1';
            const res = await request(app)
                .get(`/api/v1/booking/hotels/${hotelId}/similar?limit=5`)
                .expect(200);

            expect(res.body.success).to.be.true;
            expect(res.body.data).to.be.an('array');
            expect(res.body.data).to.have.lengthOf.at.most(5);
            res.body.data.forEach(hotel => {
                expect(hotel).to.have.property('id');
                expect(hotel).to.have.property('name');
                expect(hotel).to.have.property('similarity_score');
            });
        });

        it('should handle invalid limit parameter', async () => {
            const hotelId = 'test_hotel_1';
            const res = await request(app)
                .get(`/api/v1/booking/hotels/${hotelId}/similar?limit=invalid`)
                .expect(400);

            expect(res.body.success).to.be.false;
            expect(res.body).to.have.property('error');
        });
    });

    describe('Cache Management', () => {
        it('should get cache statistics', async () => {
            const res = await request(app)
                .get('/api/v1/booking/cache/stats')
                .set('x-api-key', process.env.API_KEY)
                .expect(200);

            expect(res.body.success).to.be.true;
            expect(res.body.data).to.have.property('hits');
            expect(res.body.data).to.have.property('misses');
            expect(res.body.data).to.have.property('keys');
            expect(res.body.data).to.have.property('memory_usage');
        });

        it('should require authentication for cache stats', async () => {
            const res = await request(app)
                .get('/api/v1/booking/cache/stats')
                .expect(401);

            expect(res.body.success).to.be.false;
            expect(res.body).to.have.property('error');
        });
    });

    describe('Rate Limiting', () => {
        it('should enforce rate limits on search endpoints', async () => {
            const promises = Array(101).fill().map(() => 
                request(app).get('/api/v1/booking/hotels/search?query=test')
            );
            
            const results = await Promise.all(promises);
            const rateLimitedResponses = results.filter(res => res.status === 429);
            
            expect(rateLimitedResponses.length).to.be.greaterThan(0);
        });

        it('should enforce rate limits on detail endpoints', async () => {
            const hotelId = 'test_hotel_1';
            const promises = Array(301).fill().map(() => 
                request(app).get(`/api/v1/booking/hotels/${hotelId}/score`)
            );
            
            const results = await Promise.all(promises);
            const rateLimitedResponses = results.filter(res => res.status === 429);
            
            expect(rateLimitedResponses.length).to.be.greaterThan(0);
        });

        it('should enforce rate limits on cache operations', async () => {
            const promises = Array(21).fill().map(() => 
                request(app)
                    .get('/api/v1/booking/cache/stats')
                    .set('x-api-key', process.env.API_KEY)
            );
            
            const results = await Promise.all(promises);
            const rateLimitedResponses = results.filter(res => res.status === 429);
            
            expect(rateLimitedResponses.length).to.be.greaterThan(0);
        });
    });

    describe('Advanced Search Scenarios', () => {
        it('should handle multiple concurrent searches with different parameters', async () => {
            const searches = [
                { checkIn: '2024-05-01', checkOut: '2024-05-05', destId: 'paris', adults: '2' },
                { checkIn: '2024-06-01', checkOut: '2024-06-05', destId: 'london', adults: '4' },
                { checkIn: '2024-07-01', checkOut: '2024-07-05', destId: 'rome', adults: '1' }
            ];

            const results = await Promise.all(
                searches.map(params => 
                    request(app)
                        .get('/api/v1/booking/hotels/search')
                        .query(params)
                )
            );

            results.forEach(res => {
                expect(res.status).to.be.oneOf([200, 429]);
                if (res.status === 200) {
                    expect(res.body.success).to.be.true;
                    expect(res.body.data).to.be.an('array');
                }
            });
        });

        it('should handle special characters in search queries', async () => {
            const specialChars = encodeURIComponent('São Paulo & Région');
            const res = await request(app)
                .get('/api/v1/booking/locations')
                .query({ query: specialChars });

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.data).to.be.an('array');
        });
    });

    describe('Complex Room Availability Scenarios', () => {
        it('should handle multiple room types with varying occupancy', async () => {
            const hotelId = 'test_hotel_1';
            const res = await request(app)
                .get(`/api/v1/booking/hotels/${hotelId}/rooms`)
                .query({
                    checkIn: '2024-05-01',
                    checkOut: '2024-05-05',
                    rooms: '2',
                    guests: '5',
                    children: '2',
                    childrenAges: '4,8'
                });

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.data).to.have.property('rooms');
            expect(res.body.data.rooms).to.be.an('array');
            res.body.data.rooms.forEach(room => {
                expect(room).to.have.property('maxOccupancy');
                expect(room).to.have.property('childrenAllowed');
            });
        });

        it('should validate date ranges for availability', async () => {
            const hotelId = 'test_hotel_1';
            const res = await request(app)
                .get(`/api/v1/booking/hotels/${hotelId}/rooms`)
                .query({
                    checkIn: '2024-05-01',
                    checkOut: '2024-04-30' // Invalid: checkout before checkin
                });

            expect(res.status).to.equal(400);
            expect(res.body.success).to.be.false;
            expect(res.body.error).to.include('date range');
        });
    });

    describe('Advanced Caching Behavior', () => {
        let clock;

        beforeEach(() => {
            clock = sinon.useFakeTimers();
            bookingComService.clearCache();
        });

        afterEach(() => {
            clock.restore();
        });

        it('should handle cache expiration correctly', async () => {
            const hotelId = 'test_hotel_1';
            
            // First request
            const res1 = await request(app)
                .get(`/api/v1/booking/hotels/${hotelId}/amenities`);
            expect(res1.status).to.equal(200);

            // Advance time by 25 minutes (just before expiration)
            clock.tick(25 * 60 * 1000);

            // Second request should still use cache
            const res2 = await request(app)
                .get(`/api/v1/booking/hotels/${hotelId}/amenities`);
            expect(res2.status).to.equal(200);
            expect(res2.body).to.deep.equal(res1.body);

            // Advance time past expiration (35 minutes total)
            clock.tick(10 * 60 * 1000);

            // Third request should fetch fresh data
            const res3 = await request(app)
                .get(`/api/v1/booking/hotels/${hotelId}/amenities`);
            expect(res3.status).to.equal(200);
        });

        it('should handle cache invalidation patterns correctly', async () => {
            const hotelId = 'test_hotel_1';

            // Cache multiple types of data
            await Promise.all([
                request(app).get(`/api/v1/booking/hotels/${hotelId}/amenities`),
                request(app).get(`/api/v1/booking/hotels/${hotelId}/facilities`),
                request(app).get(`/api/v1/booking/hotels/${hotelId}/policies`)
            ]);

            // Clear cache with specific pattern
            await request(app)
                .delete('/api/v1/booking/cache')
                .query({ pattern: 'amenities_*' })
                .set('Authorization', `Bearer ${process.env.ADMIN_TOKEN}`);

            // Verify only amenities cache was cleared
            const cacheStats = await request(app)
                .get('/api/v1/booking/cache/stats')
                .set('x-api-key', process.env.API_KEY);

            expect(cacheStats.body.data.keys).to.be.greaterThan(0);
        });
    });

    describe('Error Recovery and Resilience', () => {
        it('should handle API timeouts gracefully', async () => {
            const hotelId = 'test_hotel_1';
            const originalTimeout = bookingComService.apiClient.defaults.timeout;
            bookingComService.apiClient.defaults.timeout = 1; // Force timeout

            const res = await request(app)
                .get(`/api/v1/booking/hotels/${hotelId}/amenities`);

            expect(res.status).to.equal(500);
            expect(res.body.success).to.be.false;
            expect(res.body.error).to.include('timeout');

            bookingComService.apiClient.defaults.timeout = originalTimeout;
        });

        it('should handle partial API responses', async () => {
            const hotelId = 'test_hotel_1';
            const stub = sinon.stub(bookingComService.apiClient, 'get')
                .resolves({ data: { partial: true, warning: 'Some data unavailable' } });

            const res = await request(app)
                .get(`/api/v1/booking/hotels/${hotelId}/facilities`);

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.warning).to.exist;

            stub.restore();
        });
    });

    describe('Concurrent Operations', () => {
        it('should handle multiple concurrent cache operations', async () => {
            const operations = Array(10).fill().map(() => ({
                type: Math.random() > 0.5 ? 'read' : 'write',
                hotelId: `test_hotel_${Math.floor(Math.random() * 5) + 1}`
            }));

            const results = await Promise.all(operations.map(op => 
                op.type === 'read' 
                    ? request(app).get(`/api/v1/booking/hotels/${op.hotelId}/amenities`)
                    : request(app).get(`/api/v1/booking/hotels/${op.hotelId}/facilities`)
            ));

            results.forEach(res => {
                expect(res.status).to.be.oneOf([200, 429]);
            });
        });

        it('should maintain cache consistency under load', async () => {
            const hotelId = 'test_hotel_1';
            const requests = Array(50).fill().map(() => 
                request(app).get(`/api/v1/booking/hotels/${hotelId}/amenities`)
            );

            const results = await Promise.all(requests);
            const successfulResponses = results.filter(res => res.status === 200);
            
            // All successful responses should have the same data
            const firstResponse = successfulResponses[0].body;
            successfulResponses.forEach(res => {
                expect(res.body).to.deep.equal(firstResponse);
            });
        });
    });
}); 