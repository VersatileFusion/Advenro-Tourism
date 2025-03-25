const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Swagger definition
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Tourism API Documentation',
        version: '1.0.0',
        description: 'API documentation for the Tourism Platform',
        license: {
            name: 'Licensed Under MIT',
            url: 'https://spdx.org/licenses/MIT.html',
        },
        contact: {
            name: 'Tourism API Support',
            url: 'https://tourism-api.com/support',
            email: 'support@tourism-api.com',
        },
    },
    servers: [
        {
            url: process.env.API_URL || 'http://localhost:3000',
            description: 'Development server',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
};

// Options for the swagger docs
const options = {
    swaggerDefinition,
    // Path to the API docs
    apis: [
        './src/server/routes/*.js',
        './src/server/models/*.js',
        './src/server/controllers/*.js',
    ],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

// Serve swagger docs
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Tourism API Documentation',
}));

// Serve swagger spec as JSON
router.get('/spec', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

module.exports = router; 