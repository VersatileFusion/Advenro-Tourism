const request = require('supertest');
const { expect, setupTestDB, teardownTestDB, createTestUser, generateAuthToken, clearCollections } = require('./test-helper');

let mongod;
let testUser;
let authToken;
let server;

describe('User API Tests', () => {
    before(async () => {
        console.log('🔄 Setting up test environment...');
        const setup = await setupTestDB();
        server = setup.server;
    });

    after(async () => {
        console.log('🔄 Cleaning up test environment...');
        await teardownTestDB(mongod);
    });

    beforeEach(async () => {
        console.log('🔄 Setting up test user...');
        await clearCollections();
        testUser = await createTestUser();
        authToken = generateAuthToken(testUser);
        console.log('✅ Test user created successfully');
    });

    describe('User Registration', () => {
        it('should register a new user successfully', async () => {
            console.log('🔄 Testing user registration...');
            const userData = {
                email: 'newuser@test.com',
                password: 'Test123!',
                firstName: 'New',
                lastName: 'User'
            };
            console.log('📤 Sending registration request with data:', userData);

            const response = await request(server)
                .post('/api/v1/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.success).to.be.true;
            expect(response.body).to.have.property('token');
            expect(response.body.user).to.have.property('email', userData.email);
            console.log('✅ User registration test successful');
        });

        it('should not register user with invalid email', async () => {
            console.log('🔄 Testing invalid email registration...');
            const userData = {
                email: 'invalid-email',
                password: 'Test123!',
                firstName: 'Invalid',
                lastName: 'User'
            };
            console.log('📤 Sending registration request with invalid email');

            const response = await request(server)
                .post('/api/v1/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.success).to.be.false;
            expect(response.body).to.have.property('errors');
            console.log('✅ Invalid email registration test successful');
        });
    });

    describe('User Login', () => {
        it('should login user successfully', async () => {
            console.log('🔄 Testing user login...');
            const loginData = {
                email: testUser.email,
                password: 'Test123!'
            };
            console.log('📤 Sending login request with data:', loginData);

            const response = await request(server)
                .post('/api/v1/auth/login')
                .send(loginData)
                .expect(200);

            expect(response.body.success).to.be.true;
            expect(response.body).to.have.property('token');
            expect(response.body.user).to.have.property('email', testUser.email);
            console.log('✅ User login test successful');
        });

        it('should not login with invalid credentials', async () => {
            console.log('🔄 Testing invalid login credentials...');
            const loginData = {
                email: testUser.email,
                password: 'WrongPassword'
            };
            console.log('📤 Sending login request with invalid credentials');

            const response = await request(server)
                .post('/api/v1/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body.success).to.be.false;
            expect(response.body.message).to.include('credentials');
            console.log('✅ Invalid login credentials test successful');
        });
    });

    describe('User Profile', () => {
        it('should get user profile', async () => {
            console.log('🔄 Testing get user profile...');
            console.log('📤 Sending get profile request');

            const response = await request(server)
                .get('/api/v1/auth/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).to.be.true;
            expect(response.body.user).to.have.property('email', testUser.email);
            console.log('✅ Get user profile test successful');
        });

        it('should update user profile', async () => {
            console.log('🔄 Testing update user profile...');
            const updateData = {
                firstName: 'Updated',
                lastName: 'Name'
            };
            console.log('📤 Sending update profile request with data:', updateData);

            const response = await request(server)
                .put('/api/v1/auth/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).to.be.true;
            expect(response.body.user).to.have.property('firstName', updateData.firstName);
            expect(response.body.user).to.have.property('lastName', updateData.lastName);
            console.log('✅ Update user profile test successful');
        });
    });

    describe('Password Management', () => {
        it('should change password successfully', async () => {
            console.log('🔄 Testing password change...');
            const passwordData = {
                currentPassword: 'Test123!',
                newPassword: 'NewTest123!'
            };
            console.log('📤 Sending password change request');

            const response = await request(server)
                .put('/api/v1/auth/settings')
                .set('Authorization', `Bearer ${authToken}`)
                .send(passwordData)
                .expect(200);

            expect(response.body.success).to.be.true;
            console.log('✅ Password change test successful');
        });

        it('should not change password with incorrect current password', async () => {
            console.log('🔄 Testing password change with incorrect current password...');
            const passwordData = {
                currentPassword: 'WrongPassword',
                newPassword: 'NewTest123!'
            };
            console.log('📤 Sending password change request with wrong current password');

            const response = await request(server)
                .put('/api/v1/auth/settings')
                .set('Authorization', `Bearer ${authToken}`)
                .send(passwordData)
                .expect(401);

            expect(response.body.success).to.be.false;
            expect(response.body.message).to.include('password');
            console.log('✅ Incorrect password change test successful');
        });
    });
}); 