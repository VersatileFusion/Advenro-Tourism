const request = require('supertest');
const app = require('../../server');
const Hotel = require('../../models/Hotel');
const mongoose = require('mongoose');

describe('Hotel API Integration Tests', () => {
    let testHotel;
    let authToken;

    beforeEach(async () => {
        // Create a test user and get auth token
        const user = await global.createTestUser({ role: 'admin' });
        authToken = await global.generateAuthToken(user);

        // Create a test hotel
        testHotel = await Hotel.create({
            name: 'Test Hotel',
            description: 'Test Description',
            location: {
                type: 'Point',
                coordinates: [12.34, 56.78]
            },
            price: 100,
            amenities: [],
            images: ['test-image.jpg']
        });
    });

    describe('GET /api/v1/hotels', () => {
        it('should return paginated list of hotels', async () => {
            const response = await request(app)
                .get('/api/v1/hotels')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.pagination).toBeDefined();
        });

        it('should filter hotels by location', async () => {
            const response = await request(app)
                .get('/api/v1/hotels')
                .query({ location: '12.34,56.78' })
                .expect(200);

            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data[0].location).toBeDefined();
        });
    });

    describe('GET /api/v1/hotels/:id', () => {
        it('should return hotel by id', async () => {
            const response = await request(app)
                .get(`/api/v1/hotels/${testHotel._id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data._id).toBe(testHotel._id.toString());
        });

        it('should return 404 for non-existent hotel', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            await request(app)
                .get(`/api/v1/hotels/${fakeId}`)
                .expect(404);
        });
    });

    describe('POST /api/v1/hotels', () => {
        it('should create new hotel when authenticated as admin', async () => {
            const newHotel = {
                name: 'New Test Hotel',
                description: 'New Description',
                location: {
                    type: 'Point',
                    coordinates: [12.34, 56.78]
                },
                price: 150,
                amenities: [],
                images: ['new-image.jpg']
            };

            const response = await request(app)
                .post('/api/v1/hotels')
                .set('Authorization', `Bearer ${authToken}`)
                .send(newHotel)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe(newHotel.name);
        });

        it('should return 401 when not authenticated', async () => {
            await request(app)
                .post('/api/v1/hotels')
                .send({})
                .expect(401);
        });
    });

    // Cache testing
    describe('Caching', () => {
        it('should return cached data on subsequent requests', async () => {
            // First request
            const response1 = await request(app)
                .get('/api/v1/hotels')
                .expect(200);

            // Second request
            const response2 = await request(app)
                .get('/api/v1/hotels')
                .expect(200);

            expect(response1.body).toEqual(response2.body);
        });
    });
}); 