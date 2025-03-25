const swaggerJsdoc = require('swagger-jsdoc');
const request = require('supertest');
const { expect, setupTestDB, teardownTestDB, clearCollections, createTestUser } = require('./test-helper');
const app = require('../server/server');
const swaggerUi = require('swagger-ui-express');

// Function to validate Swagger document
const validateDocument = (document) => {
    // Basic validation of required OpenAPI fields
    expect(document).to.have.property('openapi');
    expect(document).to.have.property('info');
    expect(document.info).to.have.property('title');
    expect(document.info).to.have.property('version');
    expect(document).to.have.property('paths');
    
    // Validate paths
    const paths = document.paths;
    expect(Object.keys(paths).length).to.be.greaterThan(0);
    
    // Check if common endpoints are documented
    const commonEndpoints = ['/hotels', '/auth/login', '/auth/register', '/bookings', '/reviews'];
    commonEndpoints.forEach(endpoint => {
        expect(paths).to.have.property(endpoint);
    });
    
    return true;
};

describe('API Documentation Tests', () => {
    let swaggerSpec;
    let server;
    let testUser;
    let testHotel;

    before(async () => {
        await setupTestDB();
        
        // Create test user
        testUser = await createTestUser();

        // Create test hotel
        const { Hotel } = require('../server/models');
        testHotel = await Hotel.create({
            name: 'Test Hotel',
            description: 'A test hotel for API documentation tests',
            location: {
                coordinates: [0, 0],
                country: 'Test Country',
                city: 'Test City',
                address: 'Test Address'
            },
            owner: testUser._id,
            category: 'hotel',
            rooms: [{
                name: 'Test Room',
                type: 'single',
                capacity: 2,
                price: 100,
                description: 'A test room'
            }]
        });

        const options = {
            definition: {
                openapi: '3.0.0',
                info: {
                    title: 'Tourism API',
                    version: '1.0.0',
                    description: 'API documentation for the Tourism application'
                },
                servers: [
                    {
                        url: 'http://localhost:3000/api/v1',
                        description: 'Development server'
                    }
                ]
            },
            apis: ['./src/routes/*.js', './src/models/*.js']
        };

        swaggerSpec = swaggerJsdoc(options);
        server = app;
    });

    after(async () => {
        await teardownTestDB();
    });

    beforeEach(async () => {
        await clearCollections();
        
        // Recreate test data
        testUser = await createTestUser();
        const { Hotel } = require('../server/models');
        testHotel = await Hotel.create({
            name: 'Test Hotel',
            description: 'A test hotel for API documentation tests',
            location: {
                coordinates: [0, 0],
                country: 'Test Country',
                city: 'Test City',
                address: 'Test Address'
            },
            owner: testUser._id,
            category: 'hotel',
            rooms: [{
                name: 'Test Room',
                type: 'single',
                capacity: 2,
                price: 100,
                description: 'A test room'
            }]
        });
    });

    it('should have valid Swagger documentation', () => {
        expect(swaggerSpec).to.not.be.undefined;
        expect(swaggerSpec.openapi).to.equal('3.0.0');
        expect(swaggerSpec.info.title).to.equal('Tourism API');
        expect(swaggerSpec.info.version).to.equal('1.0.0');
        expect(Object.keys(swaggerSpec.paths).length).to.be.greaterThan(0);
    });

    describe('Endpoint Documentation Coverage', () => {
        it('should have documentation for GET /hotels', () => {
            expect(swaggerSpec.paths['/hotels']).to.not.be.undefined;
            expect(swaggerSpec.paths['/hotels'].get).to.not.be.undefined;
        });

        it('should have documentation for GET /hotels/:id', () => {
            expect(swaggerSpec.paths['/hotels/{id}']).to.not.be.undefined;
            expect(swaggerSpec.paths['/hotels/{id}'].get).to.not.be.undefined;
        });

        it('should have documentation for POST /hotels', () => {
            expect(swaggerSpec.paths['/hotels']).to.not.be.undefined;
            expect(swaggerSpec.paths['/hotels'].post).to.not.be.undefined;
        });

        it('should have documentation for PUT /hotels/:id', () => {
            expect(swaggerSpec.paths['/hotels/{id}']).to.not.be.undefined;
            expect(swaggerSpec.paths['/hotels/{id}'].put).to.not.be.undefined;
        });

        it('should have documentation for DELETE /hotels/:id', () => {
            expect(swaggerSpec.paths['/hotels/{id}']).to.not.be.undefined;
            expect(swaggerSpec.paths['/hotels/{id}'].delete).to.not.be.undefined;
        });
    });

    describe('Response Schema Validation', () => {
        it('should match hotel list response schema', async () => {
            const response = await request(server)
                .get('/api/v1/hotels')
                .expect(200);
            
            expect(Array.isArray(response.body.data)).to.be.true;
        });

        it('should match single hotel response schema', async () => {
            const response = await request(server)
                .get(`/api/v1/hotels/${testHotel._id}`)
                .expect(200);
            
            expect(response.body.data).to.have.property('_id');
            expect(response.body.data).to.have.property('name');
        });
    });
});

// Helper function to validate response against schema
function validateResponse(response, schema) {
    // Simple schema validation implementation
    // In a real application, you might want to use a library like ajv
    if (schema.type === 'object') {
        if (!response || typeof response !== 'object') return false;
        
        for (const [prop, propSchema] of Object.entries(schema.properties)) {
            if (propSchema.required && !(prop in response)) return false;
            if (prop in response && !validateResponse(response[prop], propSchema)) return false;
        }
    } else if (schema.type === 'array') {
        if (!Array.isArray(response)) return false;
        if (schema.items) {
            return response.every(item => validateResponse(item, schema.items));
        }
    } else if (schema.type) {
        return typeof response === schema.type;
    }
    
    return true;
}