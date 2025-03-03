const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Review = require('../models/Review');
const Booking = require('../models/Booking');

let token;
let user;
let hotel;
let review;

beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI_TEST, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
});

beforeEach(async () => {
    // Create test user
    user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        role: 'user'
    });
    token = user.getSignedJwtToken();

    // Create test hotel
    hotel = await Hotel.create({
        name: 'Test Hotel',
        description: 'Test Description',
        address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'Test Country'
        },
        price: 100,
        amenities: ['wifi', 'parking'],
        rating: 4.5
    });

    // Create test booking
    await Booking.create({
        user: user._id,
        itemId: hotel._id,
        bookingType: 'hotel',
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        totalPrice: 100,
        status: 'confirmed'
    });

    // Create test review
    review = await Review.create({
        title: 'Test Review',
        text: 'Test review content',
        rating: 4,
        user: user._id,
        itemType: 'hotel',
        itemId: hotel._id,
        verified: true
    });
});

afterEach(async () => {
    // Clean up database
    await User.deleteMany();
    await Hotel.deleteMany();
    await Review.deleteMany();
    await Booking.deleteMany();
});

afterAll(async () => {
    // Disconnect from database
    await mongoose.connection.close();
});

describe('Review System', () => {
    describe('GET /api/v1/reviews', () => {
        it('should get all reviews', async () => {
            const res = await request(app)
                .get('/api/v1/reviews');

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].title).toBe('Test Review');
        });

        it('should get reviews for specific item', async () => {
            const res = await request(app)
                .get(`/api/v1/hotels/${hotel._id}/reviews`);

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].itemId).toBe(hotel._id.toString());
        });
    });

    describe('POST /api/v1/hotels/:id/reviews', () => {
        it('should create a review for booked hotel', async () => {
            await Review.deleteMany(); // Clear existing review

            const res = await request(app)
                .post(`/api/v1/hotels/${hotel._id}/reviews`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: 'Great Hotel',
                    text: 'Amazing experience',
                    rating: 5,
                    photos: ['https://example.com/photo.jpg']
                });

            expect(res.status).toBe(201);
            expect(res.body.data.title).toBe('Great Hotel');
            expect(res.body.data.verified).toBe(true);

            // Check if hotel rating is updated
            const updatedHotel = await Hotel.findById(hotel._id);
            expect(updatedHotel.averageRating).toBe(5);
            expect(updatedHotel.numberOfReviews).toBe(1);
        });

        it('should prevent duplicate reviews', async () => {
            const res = await request(app)
                .post(`/api/v1/hotels/${hotel._id}/reviews`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: 'Duplicate Review',
                    text: 'Should not work',
                    rating: 5
                });

            expect(res.status).toBe(400);
        });

        it('should validate review input', async () => {
            await Review.deleteMany(); // Clear existing review

            const res = await request(app)
                .post(`/api/v1/hotels/${hotel._id}/reviews`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: '',
                    text: '',
                    rating: 6
                });

            expect(res.status).toBe(400);
        });
    });

    describe('PUT /api/v1/reviews/:id', () => {
        it('should update review', async () => {
            const res = await request(app)
                .put(`/api/v1/reviews/${review._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: 'Updated Review',
                    text: 'Updated content',
                    rating: 3
                });

            expect(res.status).toBe(200);
            expect(res.body.data.title).toBe('Updated Review');
            expect(res.body.data.rating).toBe(3);

            // Check if hotel rating is updated
            const updatedHotel = await Hotel.findById(hotel._id);
            expect(updatedHotel.averageRating).toBe(3);
        });

        it('should prevent unauthorized update', async () => {
            const otherUser = await User.create({
                name: 'Other User',
                email: 'other@example.com',
                password: 'Password123!',
                role: 'user'
            });
            const otherToken = otherUser.getSignedJwtToken();

            const res = await request(app)
                .put(`/api/v1/reviews/${review._id}`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send({
                    title: 'Unauthorized Update',
                    text: 'Should not work',
                    rating: 1
                });

            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /api/v1/reviews/:id', () => {
        it('should delete review', async () => {
            const res = await request(app)
                .delete(`/api/v1/reviews/${review._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);

            const deletedReview = await Review.findById(review._id);
            expect(deletedReview).toBeNull();

            // Check if hotel rating is updated
            const updatedHotel = await Hotel.findById(hotel._id);
            expect(updatedHotel.numberOfReviews).toBe(0);
        });

        it('should prevent unauthorized deletion', async () => {
            const otherUser = await User.create({
                name: 'Other User',
                email: 'other@example.com',
                password: 'Password123!',
                role: 'user'
            });
            const otherToken = otherUser.getSignedJwtToken();

            const res = await request(app)
                .delete(`/api/v1/reviews/${review._id}`)
                .set('Authorization', `Bearer ${otherToken}`);

            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/v1/reviews/:id/like', () => {
        it('should like and unlike review', async () => {
            // Like review
            const likeRes = await request(app)
                .put(`/api/v1/reviews/${review._id}/like`)
                .set('Authorization', `Bearer ${token}`);

            expect(likeRes.status).toBe(200);
            expect(likeRes.body.data.likes).toContain(user._id.toString());

            // Unlike review
            const unlikeRes = await request(app)
                .put(`/api/v1/reviews/${review._id}/like`)
                .set('Authorization', `Bearer ${token}`);

            expect(unlikeRes.status).toBe(200);
            expect(unlikeRes.body.data.likes).not.toContain(user._id.toString());
        });
    });
}); 