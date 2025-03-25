const request = require('supertest');
const { expect, setupTestDB, teardownTestDB } = require('../test-helper');
const { User } = require('../../server/models');
let server;

describe('Auth Endpoints', () => {
    before(async function() {
        this.timeout(30000);
        const setup = await setupTestDB();
        server = setup.server;
    });

    after(async function() {
        this.timeout(30000);
        await teardownTestDB();
    });

    describe('POST /api/v1/auth/register', () => {
        it('should register a new user', async () => {
            const userData = {
                email: 'newuser@example.com',
                password: 'Password123!',
                firstName: 'New',
                lastName: 'User'
            };

            const res = await request(server)
                .post('/api/v1/auth/register')
                .send(userData);

            expect(res.status).to.equal(201);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('token');
            expect(res.body.user).to.have.property('email', userData.email);
        });

        it('should not register user with existing email', async () => {
            // Create a user first
            await User.create({
                email: 'existing@example.com',
                password: 'Password123!',
                firstName: 'Existing',
                lastName: 'User'
            });

            const userData = {
                email: 'existing@example.com',
                password: 'Password123!',
                firstName: 'Another',
                lastName: 'User'
            };

            const res = await request(server)
                .post('/api/v1/auth/register')
                .send(userData);

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('success', false);
            expect(res.body.message).to.equal('User already exists');
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should login with valid credentials', async () => {
            // Create a user first
            const user = await User.create({
                email: 'logintest@example.com',
                password: 'Password123!',
                firstName: 'Login',
                lastName: 'Test'
            });

            const loginData = {
                email: 'logintest@example.com',
                password: 'Password123!'
            };

            const res = await request(server)
                .post('/api/v1/auth/login')
                .send(loginData);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('token');
        });

        it('should not login with invalid password', async () => {
            const loginData = {
                email: 'logintest@example.com',
                password: 'WrongPassword123!'
            };

            const res = await request(server)
                .post('/api/v1/auth/login')
                .send(loginData);

            expect(res.status).to.equal(401);
            expect(res.body).to.have.property('success', false);
            expect(res.body.message).to.equal('Invalid credentials');
        });

        it('should not login with non-existent email', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'Password123!'
            };

            const res = await request(server)
                .post('/api/v1/auth/login')
                .send(loginData);

            expect(res.status).to.equal(401);
            expect(res.body).to.have.property('success', false);
            expect(res.body.message).to.equal('Invalid credentials');
        });
    });
}); 