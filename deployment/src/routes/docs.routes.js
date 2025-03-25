const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../config/swagger');
const fs = require('fs');
const path = require('path');

// Serve Swagger documentation UI
router.use('/api-docs', swaggerUi.serve);
router.get('/api-docs', swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Tourism API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true
    }
}));

// Serve Swagger spec as JSON
router.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Generate SDK
router.get('/sdk/:language', (req, res) => {
    const { language } = req.params;
    const supportedLanguages = ['javascript', 'python', 'java', 'csharp'];
    
    if (!supportedLanguages.includes(language)) {
        return res.status(400).json({
            success: false,
            error: `SDK generation not supported for ${language}. Supported languages: ${supportedLanguages.join(', ')}`
        });
    }

    // Here you would integrate with a tool like OpenAPI Generator
    // For now, we'll return a sample SDK structure
    const sdkStructure = {
        language,
        version: '1.0.0',
        generated: new Date().toISOString(),
        endpoints: Object.keys(swaggerSpec.paths)
    };

    res.json({
        success: true,
        data: sdkStructure
    });
});

// Serve Postman collection
router.get('/postman-collection', (req, res) => {
    const postmanCollection = {
        info: {
            name: 'Tourism API',
            description: 'Complete API collection for Tourism platform',
            schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
        },
        item: generatePostmanItems(swaggerSpec.paths)
    };

    res.json(postmanCollection);
});

// Serve Insomnia collection
router.get('/insomnia-collection', (req, res) => {
    const insomniaCollection = {
        _type: 'export',
        __export_format: 4,
        __export_date: new Date().toISOString(),
        __export_source: 'tourism-api',
        resources: generateInsomniaResources(swaggerSpec.paths)
    };

    res.json(insomniaCollection);
});

// Helper function to generate Postman collection items
function generatePostmanItems(paths) {
    const items = [];
    
    for (const [path, methods] of Object.entries(paths)) {
        for (const [method, operation] of Object.entries(methods)) {
            items.push({
                name: operation.summary || `${method.toUpperCase()} ${path}`,
                request: {
                    method: method.toUpperCase(),
                    header: [
                        {
                            key: 'Content-Type',
                            value: 'application/json'
                        }
                    ],
                    url: {
                        raw: `{{baseUrl}}${path}`,
                        host: ['{{baseUrl}}'],
                        path: path.split('/').filter(Boolean)
                    },
                    description: operation.description || '',
                    body: method !== 'get' ? {
                        mode: 'raw',
                        raw: JSON.stringify(generateSampleRequestBody(operation), null, 2)
                    } : undefined
                }
            });
        }
    }

    return items;
}

// Helper function to generate Insomnia resources
function generateInsomniaResources(paths) {
    const resources = [];
    let id = 1;

    for (const [path, methods] of Object.entries(paths)) {
        for (const [method, operation] of Object.entries(methods)) {
            resources.push({
                _id: `req_${id++}`,
                type: 'request',
                name: operation.summary || `${method.toUpperCase()} ${path}`,
                method: method.toUpperCase(),
                url: `{{ _.baseUrl }}${path}`,
                body: method !== 'get' ? {
                    mimeType: 'application/json',
                    text: JSON.stringify(generateSampleRequestBody(operation), null, 2)
                } : undefined
            });
        }
    }

    return resources;
}

// Helper function to generate sample request body
function generateSampleRequestBody(operation) {
    if (!operation.requestBody) return {};

    const schema = operation.requestBody.content['application/json']?.schema;
    if (!schema) return {};

    return generateSampleFromSchema(schema);
}

// Helper function to generate sample data from schema
function generateSampleFromSchema(schema) {
    if (schema.type === 'object') {
        const sample = {};
        if (schema.properties) {
            for (const [prop, propSchema] of Object.entries(schema.properties)) {
                sample[prop] = generateSampleFromSchema(propSchema);
            }
        }
        return sample;
    } else if (schema.type === 'array') {
        return [generateSampleFromSchema(schema.items)];
    } else if (schema.example !== undefined) {
        return schema.example;
    } else {
        switch (schema.type) {
            case 'string': return 'string';
            case 'number': return 0;
            case 'integer': return 0;
            case 'boolean': return false;
            default: return null;
        }
    }
}

module.exports = router; 