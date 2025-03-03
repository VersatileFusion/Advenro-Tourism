const swaggerJSDoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Tourism Booking API',
            version: '1.0.0',
            description: 'A comprehensive tourism booking API with user profiles, reviews, and notifications',
            license: {
                name: 'ISC',
                url: 'https://opensource.org/licenses/ISC'
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
                url: 'https://api.tourism-api.com/v1',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
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
                            example: 'Resource not found'
                        },
                        statusCode: {
                            type: 'integer',
                            example: 404
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
                        error: {
                            type: 'string',
                            example: 'Validation Error'
                        },
                        details: {
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
                                        example: 'Please provide a valid email'
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
                },
                NotFoundError: {
                    description: 'The specified resource was not found',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                }
            },
            parameters: {
                pageParam: {
                    in: 'query',
                    name: 'page',
                    schema: {
                        type: 'integer',
                        default: 1
                    },
                    description: 'Page number'
                },
                limitParam: {
                    in: 'query',
                    name: 'limit',
                    schema: {
                        type: 'integer',
                        default: 10
                    },
                    description: 'Number of items per page'
                },
                sortParam: {
                    in: 'query',
                    name: 'sort',
                    schema: {
                        type: 'string'
                    },
                    description: 'Sort field (prefix with - for descending)'
                },
                selectParam: {
                    in: 'query',
                    name: 'select',
                    schema: {
                        type: 'string'
                    },
                    description: 'Fields to select (comma-separated)'
                }
            }
        },
        security: [{
            bearerAuth: []
        }],
        tags: [
            {
                name: 'Auth',
                description: 'Authentication endpoints'
            },
            {
                name: 'Users',
                description: 'User profile management'
            },
            {
                name: 'Hotels',
                description: 'Hotel management'
            },
            {
                name: 'Flights',
                description: 'Flight management'
            },
            {
                name: 'Tours',
                description: 'Tour management'
            },
            {
                name: 'Reviews',
                description: 'Review system'
            },
            {
                name: 'Bookings',
                description: 'Booking management'
            }
        ]
    },
    apis: [
        './src/routes/*.js',
        './src/models/*.js'
    ]
};

module.exports = swaggerJSDoc(options); 