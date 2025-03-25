/**
 * Test script for mock-server.js
 */

const http = require('http');

console.log('🔍 Starting Mock Server Test');

// Configuration
const PORT = 3030;
const HOST = 'localhost';

// Test endpoints to check
const endpoints = [
  {
    name: 'Health Check',
    path: '/health',
    expected: { status: 'ok' }
  },
  {
    name: 'Test Endpoint',
    path: '/test',
    expected: { success: true }
  },
  {
    name: 'Hotel Search (Booking.com path)',
    path: '/v1/hotels/search?dest_id=London&checkin_date=2024-05-01&checkout_date=2024-05-05',
    expected: { success: true }
  },
  {
    name: 'Hotel Search (App path)',
    path: '/api/v1/booking/hotels/search?dest_id=London&checkin_date=2024-05-01&checkout_date=2024-05-05',
    expected: { success: true }
  },
  {
    name: 'Hotel Details for ID 123456',
    path: '/api/v1/booking/hotels/123456',
    expected: { success: true }
  },
  {
    name: 'Locations Search',
    path: '/api/v1/booking/locations?name=London',
    expected: { success: true }
  }
];

// Run tests sequentially
async function runTests() {
  console.log(`🔄 Testing mock server at http://${HOST}:${PORT}`);
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('✅ All tests completed');
}

// Test a single endpoint
function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    console.log(`\n🔄 Testing: ${endpoint.name} (${endpoint.path})`);
    
    const options = {
      hostname: HOST,
      port: PORT,
      path: endpoint.path,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      console.log(`🔔 Status Code: ${res.statusCode}`);
      
      const chunks = [];
      
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      res.on('end', () => {
        try {
          const body = Buffer.concat(chunks).toString();
          
          console.log(`📄 Response size: ${body.length} bytes`);
          
          const response = JSON.parse(body);
          
          // Verify expected response
          if (endpoint.expected) {
            Object.entries(endpoint.expected).forEach(([key, value]) => {
              if (response[key] === value) {
                console.log(`✅ Expected '${key}' matches: ${value}`);
              } else {
                console.log(`❌ Expected '${key}' to be ${value} but got ${response[key]}`);
              }
            });
          }
          
          if (endpoint.path.includes('/hotels/search') && response.data) {
            console.log(`✅ Found ${response.data.length} hotels in search results`);
          } else if (endpoint.path.includes('/hotels/') && !endpoint.path.includes('/search') && response.data) {
            console.log(`✅ Found hotel details: ${response.data.name}`);
          } else if (endpoint.path.includes('/locations') && response.data) {
            console.log(`✅ Found ${response.data.length} locations in results`);
          }
          
          resolve();
        } catch (error) {
          console.error(`❌ Error parsing response: ${error.message}`);
          console.log(`📄 Raw response: ${Buffer.concat(chunks).toString()}`);
          resolve();
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`❌ Request error: ${error.message}`);
      resolve();
    });
    
    // Set a timeout
    req.setTimeout(5000, () => {
      console.error('❌ Request timed out after 5 seconds');
      req.destroy();
      resolve();
    });
    
    req.end();
  });
}

// Start the tests
runTests(); 