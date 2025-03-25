/**
 * Test script for booking-proxy.js
 * 
 * This script tests the proxy server to verify it's correctly proxying requests
 * to the Booking.com API.
 */

require('dotenv').config();
const http = require('http');

console.log('🔍 Starting Booking.com Proxy Test');

// Configuration
const PROXY_PORT = process.env.PROXY_PORT || 3030;

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
    name: 'Hotel Search',
    path: '/api/v1/booking/v1/hotels/search?dest_id=London&checkin_date=2024-05-01&checkout_date=2024-05-05&adults_number=2&room_number=1&units=metric',
    expected: null // Real API response, will vary
  }
];

// Run tests sequentially
async function runTests() {
  console.log(`🔄 Testing proxy server at http://localhost:${PROXY_PORT}`);
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('✅ Tests completed');
}

// Test a single endpoint
function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    console.log(`\n🔄 Testing: ${endpoint.name} (${endpoint.path})`);
    
    const options = {
      hostname: 'localhost',
      port: PROXY_PORT,
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
          
          if (body.length < 1000 || endpoint.expected) {
            console.log(`📄 Response: ${body}`);
          } else {
            console.log(`📄 Response received (${body.length} bytes)`);
          }
          
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
          
          if (response.success === false && response.error) {
            console.log(`❌ Error: ${response.error} - ${response.message}`);
          } else if (endpoint.path.includes('/hotels/search') && response.data) {
            console.log(`✅ Found ${response.data.length} hotels in search results`);
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
    req.setTimeout(10000, () => {
      console.error('❌ Request timed out after 10 seconds');
      req.destroy();
      resolve();
    });
    
    req.end();
  });
}

// Start the tests
runTests(); 