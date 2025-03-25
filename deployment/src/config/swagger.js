const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Tourism Booking API Documentation',
            version: '1.0.0',
            description: 'Complete API documentation for the Tourism Booking platform',
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            },
            contact: {
                name: 'API Support',
                url: 'https://tourism-api.com/support',
                email: 'support@tourism-api.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000/api/v1',
                description: 'Development server'
            },
            {
                url: 'https://staging-api.tourism.com/api/v1',
                description: 'Staging server'
            },
            {
                url: 'https://api.tourism.com/api/v1',
                description: 'Production server'
            }
        ],
        security: [
            {
                BearerAuth: []
            }
        ],
        tags: [
            { name: 'Auth', description: 'Authentication endpoints' },
            { name: 'Hotels', description: 'Hotel management endpoints' },
            { name: 'Bookings', description: 'Booking management endpoints' },
            { name: 'Users', description: 'User management endpoints' },
            { name: 'Reviews', description: 'Review management endpoints' },
            { name: 'Payments', description: 'Payment processing endpoints' },
            { name: 'Destinations', description: 'Destination management endpoints' }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        error: {
                            type: 'string',
                            example: 'Error message'
                        }
                    }
                },
                ValidationError: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: {
                                        type: 'string',
                                        example: 'email'
                                    },
                                    message: {
                                        type: 'string',
                                        example: 'Invalid email format'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                UnauthorizedError: {
                    description: 'Access token is missing or invalid',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                ValidationError: {
                    description: 'Validation failed',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ValidationError'
                            }
                        }
                    }
                }
            }
        }
    },
    apis: [
        './src/routes/*.js',
        './src/models/*.js',
        './src/docs/*.yaml'
    ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec; 