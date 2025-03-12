const swaggerJsdoc = require('swagger-jsdoc');
const { validateDocument } = require('swagger-parser');
const request = require('supertest');
const app = require('../server');

describe('API Documentation Tests', () => {
    let swaggerSpec;

    beforeAll(async () => {
        // Swagger configuration
        const options = {
            definition: {
                openapi: '3.0.0',
                info: {
                    title: 'Tourism API Documentation',
                    version: '1.0.0',
                    description: 'API documentation for the Tourism booking platform'
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
    });

    it('should have valid Swagger documentation', async () => {
        await expect(validateDocument(swaggerSpec)).resolves.toBeDefined();
    });

    describe('Endpoint Documentation Coverage', () => {
        const endpoints = [
            { method: 'GET', path: '/hotels' },
            { method: 'GET', path: '/hotels/:id' },
            { method: 'POST', path: '/hotels' },
            { method: 'PUT', path: '/hotels/:id' },
            { method: 'DELETE', path: '/hotels/:id' },
            // Add more endpoints as needed
        ];

        endpoints.forEach(({ method, path }) => {
            it(`should have documentation for ${method} ${path}`, () => {
                const paths = swaggerSpec.paths;
                const normalizedPath = path.replace(/:\w+/g, '{id}');
                expect(paths[normalizedPath][method.toLowerCase()]).toBeDefined();
            });
        });
    });

    describe('Response Schema Validation', () => {
        it('should match hotel list response schema', async () => {
            const response = await request(app)
                .get('/api/v1/hotels')
                .expect(200);

            const schema = swaggerSpec.paths['/hotels'].get.responses['200'].content['application/json'].schema;
            expect(validateResponse(response.body, schema)).toBe(true);
        });

        it('should match single hotel response schema', async () => {
            // Create a test hotel first
            const user = await global.createTestUser({ role: 'admin' });
            const authToken = await global.generateAuthToken(user);

            const hotel = await request(app)
                .post('/api/v1/hotels')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Hotel',
                    description: 'Test Description',
                    price: 100
                });

            const response = await request(app)
                .get(`/api/v1/hotels/${hotel.body.data._id}`)
                .expect(200);

            const schema = swaggerSpec.paths['/hotels/{id}'].get.responses['200'].content['application/json'].schema;
            expect(validateResponse(response.body, schema)).toBe(true);
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