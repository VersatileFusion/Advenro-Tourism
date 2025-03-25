const sinon = require('sinon');
const { expect, setupTestDB, teardownTestDB } = require('../test-helper');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Create a mock User model
const mockUser = {
    _id: 'user123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'user',
    subscribeNewsletter: true,
    save: sinon.stub().resolves()
};

// Mock the User model
const UserMock = {
    findOne: sinon.stub(),
    prototype: {
        save: sinon.stub().resolves()
    }
};

// Mock the models module
const modelsMock = {
    User: function() {
        return mockUser;
    }
};
modelsMock.User.findOne = UserMock.findOne;

// Use proxyquire to replace the models in the controller
const proxyquire = require('proxyquire');
const authController = proxyquire('../../server/controllers/auth.controller', {
    '../models': modelsMock
});

describe('Auth Controller', () => {
    let req;
    let res;
    let connection;

    before(async () => {
        connection = await setupTestDB();
    });

    after(async () => {
        await teardownTestDB(connection);
    });
  
    beforeEach(() => {
        req = {
            body: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                password: 'password123',
                subscribeNewsletter: true
            }
        };

        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        // Reset stubs
        UserMock.findOne.reset();
        mockUser.save.reset();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('register', () => {
        it('should successfully register a new user', async () => {
            // Setup stubs
            UserMock.findOne.resolves(null);
            sinon.stub(bcrypt, 'genSalt').resolves('salt');
            sinon.stub(bcrypt, 'hash').resolves('hashedPassword');
            sinon.stub(jwt, 'sign').returns('mockToken');
            
            // Call the register function
            await authController.register(req, res);
            
            // Verify the response
            expect(res.status.calledWith(201)).to.be.true;
            expect(res.json.calledOnce).to.be.true;
            
            // Check the response format
            const expectedResponse = {
                success: true,
                token: 'mockToken',
                user: {
                    id: 'user123',
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    role: 'user',
                    subscribeNewsletter: true
                }
            };
            
            expect(res.json.firstCall.args[0]).to.deep.equal(expectedResponse);
        });

        it('should return 400 if user already exists', async () => {
            // Setup stubs
            UserMock.findOne.resolves({ email: 'john@example.com' });
            
            // Call the register function
            await authController.register(req, res);

            // Verify the response
            expect(res.status.calledWith(400)).to.be.true;
            expect(res.json.calledWith({
                success: false,
                message: 'User already exists'
            })).to.be.true;
        });
    });

    describe('login', () => {
        it('should successfully login a user', async () => {
            const mockUserWithPassword = {
                _id: 'user123',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                password: 'hashedPassword',
                role: 'user',
                preferences: {
                    newsletter: true
                },
                comparePassword: sinon.stub().resolves(true)
            };

            // Setup stubs
            const selectStub = sinon.stub().resolves(mockUserWithPassword);
            UserMock.findOne.returns({
                select: selectStub
            });
            sinon.stub(jwt, 'sign').returns('mockToken');

            // Set request body for login
            req.body = {
                email: 'john@example.com',
                password: 'password123'
            };

            // Call the login function
            await authController.login(req, res);

            // Verify the response
            expect(res.json.calledOnce).to.be.true;
            const response = res.json.firstCall.args[0];
            expect(response).to.deep.equal({
                success: true,
                token: 'mockToken',
                user: {
                    id: 'user123',
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    role: 'user',
                    subscribeNewsletter: true
                }
            });
        });

        it('should return 401 for invalid credentials', async () => {
            // Setup stubs
            const selectStub = sinon.stub().resolves(null);
            UserMock.findOne.returns({
                select: selectStub
            });

            // Set request body for login
            req.body = {
                email: 'wrong@example.com',
                password: 'wrongpassword'
            };

            // Call the login function
            await authController.login(req, res);

            // Verify the response
            expect(res.status.calledWith(401)).to.be.true;
            expect(res.json.calledOnce).to.be.true;
            const response = res.json.firstCall.args[0];
            expect(response).to.deep.equal({
                success: false,
                message: 'Invalid credentials'
            });
        });
    });
}); 