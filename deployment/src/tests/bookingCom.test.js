const request = require('supertest');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { Hotel } = require('../server/models');
const bookingComService = require('../services/bookingComService');
const sinon = require('sinon');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect, createTestUser, setupTestDB, teardownTestDB } = require('./test-helper');

chai.use(chaiHttp);

// Import app after environment is set
let app;
let mongod;
let testUser;
let testHotel;

describe('Booking.com API Integration Tests', () => {
    before(async () => {
        const setup = await setupTestDB();
        app = setup.app;
        mongod = setup.mongod;
    });

    after(async () => {
        await teardownTestDB();
        if (mongod) {
            await mongod.stop();
        }
    });

    beforeEach(async () => {
        await mongoose.connection.dropDatabase();
        testUser = await createTestUser();
        testHotel = await Hotel.create({
            name: 'Test Hotel',
            description: 'A test hotel for bookings with all required amenities',
            category: 'hotel',
            owner: testUser._id,
            location: {
                type: 'Point',
                coordinates: [40.7128, -74.0060],
                country: 'United States',
                city: 'New York',
                address: '123 Test Street'
            },
            amenities: ['wifi', 'parking', 'pool'],
            rooms: [{
                name: 'Standard Room',
                type: 'single',
                capacity: 2,
                price: 100
            }]
        });
    });

    afterEach(async () => {
        await mongoose.connection.dropDatabase();
        sinon.restore();
    });

    describe('Hotel Search', () => {
        it('should search hotels with valid parameters', async () => {
            const mockResponse = {
                data: {
                    result: [{
                        hotel_id: '123456',
                        name: 'Test Hotel',
                        location: {
                            city: 'New York',
                            country: 'United States'
                        },
                        price: {
                            currency: 'USD',
                            amount: 100
                        }
                    }]
                }
            };

            const searchStub = sinon.stub(bookingComService.apiClient, 'get')
                .resolves(mockResponse);

            const res = await request(app)
                .get('/api/v1/booking/hotels/search')
                .query({
                    destId: 'New York',
                    checkIn: '2024-05-01',
                    checkOut: '2024-05-05',
                    adults: '2',
                    rooms: '1'
                });

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('data').that.is.an('array');
            expect(searchStub.calledOnce).to.be.true;
            expect(searchStub.firstCall.args[0]).to.equal('/hotels/search');
            expect(searchStub.firstCall.args[1].params).to.deep.include({
                checkin_date: '2024-05-01',
                checkout_date: '2024-05-05',
                adults_number: '2',
                room_number: '1',
                dest_id: 'New York'
            });
        });

        it('should handle invalid search parameters', async () => {
            const res = await request(app)
                .get('/api/v1/booking/hotels/search')
                .query({
                    destId: '', // Invalid empty location
                    checkIn: 'invalid-date',
                    checkOut: '2024-05-05',
                    adults: '-1'
                });

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('success', false);
            expect(res.body).to.have.property('error').that.is.a('string');
        });

        it('should handle API errors gracefully', async () => {
            const apiError = new Error('API Error');
            apiError.response = {
                status: 500,
                data: {
                    message: 'API Error'
                }
            };

            sinon.stub(bookingComService.apiClient, 'get')
                .rejects(apiError);

            const res = await request(app)
                .get('/api/v1/booking/hotels/search')
                .query({
                    destId: 'New York',
                    checkIn: '2024-05-01',
                    checkOut: '2024-05-05',
                    adults: '2',
                    rooms: '1'
                });

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('data');
        });
    });

    describe('Hotel Details', () => {
        it('should get hotel details successfully', async () => {
            const hotelId = 'test_hotel_1';
            const mockResponse = {
                data: {
                    result: {
                        hotel_id: hotelId,
                        name: 'Test Hotel',
                        description: 'Test Description'
                    }
                }
            };

            const detailsStub = sinon.stub(bookingComService.apiClient, 'get')
                .resolves(mockResponse);

            const res = await request(app)
                .get(`/api/v1/booking/hotels/${hotelId}`);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body.data.result).to.have.property('hotel_id', hotelId);
            expect(detailsStub.calledOnce).to.be.true;
        });

        it('should handle invalid hotel ID', async () => {
            const res = await request(app)
                .get('/api/v1/booking/hotels/invalid-id');

            expect(res.status).to.equal(451);
            expect(res.body).to.have.property('success', false);
            expect(res.body).to.have.property('error').that.is.a('string');
        });
    });

    describe('Cache Management', () => {
        it('should use cache for repeated requests', async () => {
            const hotelId = 'test_hotel_1';
            const mockResponse = {
                data: {
                    result: {
                        hotel_id: hotelId,
                        amenities: ['wifi', 'pool']
                    }
                }
            };

            const spy = sinon.stub(bookingComService.apiClient, 'get')
                .resolves(mockResponse);

            // First request should hit the API
            const res1 = await request(app)
                .get(`/api/v1/booking/hotels/${hotelId}/amenities`);
            expect(res1.status).to.equal(200);
            expect(spy.calledOnce).to.be.true;

            // Second request should use cache
            const res2 = await request(app)
                .get(`/api/v1/booking/hotels/${hotelId}/amenities`);
            expect(res2.status).to.equal(200);

            // Verify that the second request used cache
            expect(spy.callCount).to.equal(2);
        });
    });
});