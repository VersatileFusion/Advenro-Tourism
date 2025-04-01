#!/usr/bin/env node
/**
 * Test Generator Script
 * 
 * Usage: node generate-test.js <type> <name>
 * 
 * Example: 
 *   node generate-test.js controller user
 *   node generate-test.js model booking
 *   node generate-test.js middleware auth
 * 
 * This will generate a test file based on the appropriate template
 * in the test/templates directory.
 */

const fs = require('fs');
const path = require('path');

// Define paths
const templatesDir = path.join(__dirname, '../test/templates');
const testDir = path.join(__dirname, '../test/unit');

// Get command line arguments
const testType = process.argv[2]; // controller, model, middleware, service
const testName = process.argv[3]; // e.g., user, booking, etc.

// Validate arguments
if (!testType || !testName) {
  console.error('Error: Please provide both test type and name.');
  console.error('Usage: node generate-test.js <type> <name>');
  console.error('Example: node generate-test.js controller user');
  process.exit(1);
}

// Validate test type
const validTypes = ['controller', 'model', 'middleware', 'service'];
if (!validTypes.includes(testType)) {
  console.error(`Error: Invalid test type. Must be one of: ${validTypes.join(', ')}`);
  process.exit(1);
}

// Construct file paths
const templateFile = path.join(templatesDir, `${testType}.test.template.js`);
const targetDir = path.join(testDir, `${testType}s`);
const targetFile = path.join(targetDir, `${testName}.test.js`);

// Check if template exists
if (!fs.existsSync(templateFile)) {
  console.error(`Error: Template file does not exist: ${templateFile}`);
  process.exit(1);
}

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Helper functions for string manipulation
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const toCamelCase = (str) => str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

// Read template and make replacements
const templateContent = fs.readFileSync(templateFile, 'utf8');
let targetContent = templateContent;

// Make substitutions based on test type
if (testType === 'controller') {
  const modelName = capitalize(testName);
  const controllerPath = `../../../src/controllers/${testName}Controller`;
  const controllerName = `${testName}Controller`;
  
  targetContent = templateContent
    .replace(/\[ModelName\]/g, modelName)
    .replace(/\[controllerPath\]/g, controllerPath)
    .replace(/\[controllerName\]/g, controllerName)
    .replace(/\[getAll\]/g, `getAll${modelName}s`)
    .replace(/\[getOne\]/g, `get${modelName}`)
    .replace(/\[create\]/g, `create${modelName}`)
    .replace(/\[update\]/g, `update${modelName}`)
    .replace(/\[delete\]/g, `delete${modelName}`);
} else if (testType === 'model') {
  const modelName = capitalize(testName);
  targetContent = templateContent
    .replace(/\[ModelName\]/g, modelName)
    .replace(/\[modelPath\]/g, `../../../src/models/${modelName}`)
    .replace(/\[modelName\]/g, testName);
} else if (testType === 'middleware') {
  const middlewareName = toCamelCase(testName);
  targetContent = templateContent
    .replace(/\[middlewareName\]/g, middlewareName)
    .replace(/\[middlewarePath\]/g, `../../../src/middleware/${testName}`);
} else if (testType === 'service') {
  const serviceName = toCamelCase(testName);
  targetContent = templateContent
    .replace(/\[serviceName\]/g, serviceName)
    .replace(/\[servicePath\]/g, `../../../src/services/${testName}`);
}

// Write to target file
fs.writeFileSync(targetFile, targetContent);

console.log(`✅ Successfully generated test file: ${targetFile}`);
console.log(`Next steps:`);
console.log(` 1. Customize the tests for your ${testType}`);
console.log(` 2. Run the tests with: npm test`); 