/**
 * API Connections Test - Tests that frontend API calls match expected pattern
 */

// Set test environment
process.env.NODE_ENV = "test";

const chai = require("chai");
const expect = chai.expect;
const path = require("path");
const fs = require("fs");

// Find all JS files in the public directory recursively
function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(function(file) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findJsFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Extract API calls from JavaScript files
function extractApiCalls(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const apiCalls = [];
  
  // Regex to find API calls in various formats
  const patterns = [
    // ApiService direct calls
    /\.get\(['"]([^'"]+)['"]/g,
    /\.post\(['"]([^'"]+)['"]/g,
    /\.put\(['"]([^'"]+)['"]/g,
    /\.delete\(['"]([^'"]+)['"]/g,
    
    // Fetch calls
    /fetch\(['"](\/api[^'"]+)['"]/g,
    /fetch\(`(\/api[^`]+)`/g,
    
    // Axios calls
    /axios\.get\(['"]([^'"]+)['"]/g,
    /axios\.post\(['"]([^'"]+)['"]/g,
    /axios\.put\(['"]([^'"]+)['"]/g,
    /axios\.delete\(['"]([^'"]+)['"]/g
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      let endpoint = match[1];
      
      // Check if it's an API endpoint
      if (endpoint.startsWith('/api/') || 
          endpoint.includes('/api/') ||
          endpoint.startsWith('api/')) {
        
        // Normalize the endpoint
        if (!endpoint.startsWith('/')) {
          endpoint = '/' + endpoint;
        }
        
        apiCalls.push({
          endpoint,
          file: path.basename(filePath)
        });
      }
    }
  });
  
  return apiCalls;
}

// Get expected backend routes based on common API patterns
function getExpectedBackendRoutes() {
  return [
    // Auth routes
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/auth/me',
    '/api/auth/reset-password',
    
    // User routes
    '/api/users',
    '/api/users/me',
    '/api/users/profile',
    '/api/users/favorites',
    '/api/users/bookings',
    
    // Hotel routes
    '/api/hotels',
    '/api/hotels/:id',
    '/api/hotels/:id/rooms',
    '/api/hotels/:id/booking',
    '/api/hotels/:id/reviews',
    
    // Tour routes
    '/api/tours',
    '/api/tours/:id',
    '/api/tours/:id/booking',
    '/api/tours/:id/reviews',
    
    // Review routes
    '/api/reviews',
    '/api/reviews/:id',
    
    // Booking routes
    '/api/bookings',
    '/api/bookings/:id',
    '/api/bookings/:id/cancel',
    
    // Payment routes
    '/api/payments/create-payment-intent',
    '/api/payments/webhook',
    
    // Destination routes
    '/api/destinations/popular',
    '/api/destinations/search'
  ];
}

describe("API Connections", function() {
  
  it("should find frontend JS files", function() {
    const publicDir = path.join(__dirname, '..', 'public');
    const jsFiles = findJsFiles(publicDir);
    
    expect(jsFiles).to.be.an('array');
    expect(jsFiles.length).to.be.greaterThan(0);
    console.log(`Found ${jsFiles.length} JavaScript files in frontend`);
  });
  
  it("should list frontend API calls", function() {
    const publicDir = path.join(__dirname, '..', 'public');
    const jsFiles = findJsFiles(publicDir);
    
    expect(jsFiles).to.be.an('array');
    expect(jsFiles.length).to.be.greaterThan(0);
    
    let allApiCalls = [];
    jsFiles.forEach(file => {
      const apiCalls = extractApiCalls(file);
      allApiCalls = allApiCalls.concat(apiCalls);
    });
    
    // Group by endpoint for easier reading
    const groupedByEndpoint = {};
    allApiCalls.forEach(call => {
      if (!groupedByEndpoint[call.endpoint]) {
        groupedByEndpoint[call.endpoint] = [];
      }
      if (!groupedByEndpoint[call.endpoint].includes(call.file)) {
        groupedByEndpoint[call.endpoint].push(call.file);
      }
    });
    
    // Display results
    console.log("\nFrontend API Endpoints:");
    console.log("======================");
    Object.keys(groupedByEndpoint).sort().forEach(endpoint => {
      console.log(`${endpoint} - Used in: ${groupedByEndpoint[endpoint].join(', ')}`);
    });
    
    // Compare with expected backend routes
    const expectedRoutes = getExpectedBackendRoutes();
    console.log("\nComparing with expected backend routes:");
    console.log("=======================================");
    
    // Find matches and mismatches
    const foundEndpoints = Object.keys(groupedByEndpoint);
    const matches = foundEndpoints.filter(endpoint => 
      expectedRoutes.some(route => {
        // Convert route pattern to regex for matching
        const routePattern = route.replace(/:\w+/g, '[^/]+');
        const regex = new RegExp(`^${routePattern.replace(/\//g, '\\/')}$`);
        return regex.test(endpoint);
      })
    );
    
    const mismatches = foundEndpoints.filter(endpoint => 
      !expectedRoutes.some(route => {
        const routePattern = route.replace(/:\w+/g, '[^/]+');
        const regex = new RegExp(`^${routePattern.replace(/\//g, '\\/')}$`);
        return regex.test(endpoint);
      })
    );
    
    console.log(`Matched routes: ${matches.length}`);
    console.log(`Potentially missing backend routes: ${mismatches.length}`);
    
    if (mismatches.length > 0) {
      console.log("\nPotentially missing backend routes:");
      mismatches.forEach(route => {
        console.log(`- ${route} (used in: ${groupedByEndpoint[route].join(', ')})`);
      });
    }
    
    // Test assertion - at least some routes should match expected patterns
    expect(matches.length).to.be.greaterThan(0);
  });
}); 