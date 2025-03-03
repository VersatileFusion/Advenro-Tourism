const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const { generateToken } = require('../utils/twoFactorAuth');

let token;
let user;

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
});

afterEach(async () => {
    // Clean up database
    await User.deleteMany();
});

afterAll(async () => {
    // Disconnect from database
    await mongoose.connection.close();
});

describe('User Profile Management', () => {
    describe('GET /api/v1/users/me', () => {
        it('should get current user profile', async () => {
            const res = await request(app)
                .get('/api/v1/users/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('Test User');
            expect(res.body.data.email).toBe('test@example.com');
        });

        it('should return 401 if not authenticated', async () => {
            const res = await request(app)
                .get('/api/v1/users/me');

            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/v1/users/profile', () => {
        it('should update user profile', async () => {
            const res = await request(app)
                .put('/api/v1/users/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Updated Name',
                    phone: '+1234567890',
                    address: {
                        street: '123 Test St',
                        city: 'Test City',
                        state: 'Test State',
                        zipCode: '12345',
                        country: 'Test Country'
                    }
                });

            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('Updated Name');
            expect(res.body.data.phone).toBe('+1234567890');
            expect(res.body.data.address.city).toBe('Test City');
        });

        it('should validate phone number format', async () => {
            const res = await request(app)
                .put('/api/v1/users/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    phone: 'invalid'
                });

            expect(res.status).toBe(400);
        });
    });

    describe('PUT /api/v1/users/email', () => {
        it('should update email with verification', async () => {
            const res = await request(app)
                .put('/api/v1/users/email')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    email: 'newemail@example.com',
                    password: 'Password123!'
                });

            expect(res.status).toBe(200);
            expect(res.body.data).toBe('Email verification sent');

            const updatedUser = await User.findById(user._id);
            expect(updatedUser.emailVerified).toBe(false);
            expect(updatedUser.emailVerificationToken).toBeDefined();
        });

        it('should require current password', async () => {
            const res = await request(app)
                .put('/api/v1/users/email')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    email: 'newemail@example.com'
                });

            expect(res.status).toBe(400);
        });
    });

    describe('PUT /api/v1/users/password', () => {
        it('should update password', async () => {
            const res = await request(app)
                .put('/api/v1/users/password')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    currentPassword: 'Password123!',
                    newPassword: 'NewPassword123!'
                });

            expect(res.status).toBe(200);
            expect(res.body.token).toBeDefined();

            // Verify new password works
            const updatedUser = await User.findById(user._id).select('+password');
            const isMatch = await updatedUser.matchPassword('NewPassword123!');
            expect(isMatch).toBe(true);
        });

        it('should validate password requirements', async () => {
            const res = await request(app)
                .put('/api/v1/users/password')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    currentPassword: 'Password123!',
                    newPassword: 'weak'
                });

            expect(res.status).toBe(400);
        });
    });

    describe('PUT /api/v1/users/2fa/enable', () => {
        it('should enable 2FA', async () => {
            // First request to get secret
            const setup = await request(app)
                .post('/api/v1/users/2fa/setup')
                .set('Authorization', `Bearer ${token}`);

            expect(setup.status).toBe(200);
            expect(setup.body.data.secret).toBeDefined();
            expect(setup.body.data.qrCode).toBeDefined();

            // Generate valid token
            const token = generateToken(setup.body.data.secret);

            // Enable 2FA with token
            const res = await request(app)
                .put('/api/v1/users/2fa/enable')
                .set('Authorization', `Bearer ${token}`)
                .send({ token });

            expect(res.status).toBe(200);
            
            const updatedUser = await User.findById(user._id);
            expect(updatedUser.twoFactorEnabled).toBe(true);
            expect(updatedUser.twoFactorSecret).toBeDefined();
        });

        it('should reject invalid 2FA token', async () => {
            const res = await request(app)
                .put('/api/v1/users/2fa/enable')
                .set('Authorization', `Bearer ${token}`)
                .send({ token: '123456' });

            expect(res.status).toBe(400);
        });
    });

    describe('PUT /api/v1/users/avatar', () => {
        it('should upload avatar', async () => {
            const res = await request(app)
                .put('/api/v1/users/avatar')
                .set('Authorization', `Bearer ${token}`)
                .attach('avatar', '__tests__/fixtures/test-avatar.jpg');

            expect(res.status).toBe(200);
            expect(res.body.data).toMatch(/avatar_.*\.jpg$/);

            const updatedUser = await User.findById(user._id);
            expect(updatedUser.avatar).toBe(res.body.data);
        });

        it('should validate image file type', async () => {
            const res = await request(app)
                .put('/api/v1/users/avatar')
                .set('Authorization', `Bearer ${token}`)
                .attach('avatar', '__tests__/fixtures/test.txt');

            expect(res.status).toBe(400);
        });
    });
}); 