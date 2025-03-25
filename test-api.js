const http = require('http');

console.log('Starting API test...');

// Test the real Booking.com API endpoint through the proxy
const realApiOptions = {
    method: 'GET',
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/booking/hotels/search?dest_id=London&checkin_date=2024-05-01&checkout_date=2024-05-05&adults_number=2&room_number=1&units=metric',
    headers: {
        'Accept': 'application/json'
    }
};

// Test the mock endpoint
const mockApiOptions = {
    method: 'GET',
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/booking/mock',
    headers: {
        'Accept': 'application/json'
    }
};

// Test the mock hotel search endpoint
const mockHotelSearchOptions = {
    method: 'GET',
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/booking/hotels/search?dest_id=London&checkin_date=2024-05-01&checkout_date=2024-05-05',
    headers: {
        'Accept': 'application/json'
    }
};

console.log('Testing mock API generic endpoint...');
testEndpoint(mockApiOptions, 'Mock API');

console.log('Testing mock hotel search endpoint...');
testEndpoint(mockHotelSearchOptions, 'Mock Hotel Search');

// Uncomment to test the real API (will return 451 in restricted regions)
// console.log('Testing real API endpoint...');
// testEndpoint(realApiOptions, 'Real API');

function testEndpoint(options, label) {
    console.log(`Request options for ${label}:`, options);

    const req = http.request(options, function (res) {
        console.log(`${label} Status Code: ${res.statusCode}`);
        console.log(`${label} Response Headers:`, JSON.stringify(res.headers, null, 2));
        
        const chunks = [];

        res.on('data', function (chunk) {
            chunks.push(chunk);
            console.log(`${label} Received chunk:`, chunk.toString());
        });

        res.on('end', function () {
            console.log(`${label} Response complete`);
            try {
                const body = Buffer.concat(chunks).toString();
                console.log(`${label} Raw response body:`, body);
                
                if (!body) {
                    console.log(`${label} Empty response body`);
                    return;
                }
                
                const response = JSON.parse(body);
                console.log(`${label} Parsed Response:`, JSON.stringify(response, null, 2));
                
                if (response.data && response.data.length > 0) {
                    const hotelId = response.data[0].id;
                    console.log(`${label} Found hotel ID: ${hotelId}`);
                    
                    // If we have a hotel ID, test the hotel details endpoint
                    if (hotelId) {
                        testHotelDetails(hotelId, label);
                    }
                } else {
                    console.log(`${label} No hotels found in search results or unexpected response format`);
                }
            } catch (error) {
                console.error(`${label} Error processing response:`, error.message);
                console.error(`${label} Error stack:`, error.stack);
                console.log(`${label} Raw response:`, Buffer.concat(chunks).toString());
            }
        });
    });

    req.on('error', (error) => {
        console.error(`${label} Request Error:`, error.message);
        console.error(`${label} Error stack:`, error.stack);
    });

    // Set a timeout
    req.setTimeout(10000, () => {
        console.error(`${label} Request timed out after 10 seconds`);
        req.destroy();
    });

    console.log(`Sending ${label} request...`);
    req.end();
    console.log(`${label} Request sent`);
}

function testHotelDetails(hotelId, parentLabel) {
    const label = `${parentLabel} Details`;
    const detailsOptions = {
        method: 'GET',
        hostname: 'localhost',
        port: 3001,
        path: `/api/v1/booking/hotels/${hotelId}`,
        headers: {
            'Accept': 'application/json'
        }
    };
    
    console.log(`${label} Request options:`, detailsOptions);
    
    const detailsReq = http.request(detailsOptions, function(res) {
        console.log(`${label} Status Code: ${res.statusCode}`);
        console.log(`${label} Response Headers:`, JSON.stringify(res.headers, null, 2));
        
        const chunks = [];
        
        res.on('data', function(chunk) {
            chunks.push(chunk);
            console.log(`${label} Received chunk:`, chunk.toString());
        });
        
        res.on('end', function() {
            console.log(`${label} Response complete`);
            try {
                const body = Buffer.concat(chunks).toString();
                console.log(`${label} Raw response body:`, body);
                
                if (!body) {
                    console.log(`${label} Empty response body`);
                    return;
                }
                
                const response = JSON.parse(body);
                console.log(`${label} Parsed Response:`, JSON.stringify(response, null, 2));
            } catch (error) {
                console.error(`${label} Error processing response:`, error.message);
                console.error(`${label} Error stack:`, error.stack);
                console.log(`${label} Raw response:`, Buffer.concat(chunks).toString());
            }
        });
    });
    
    detailsReq.on('error', (error) => {
        console.error(`${label} Request Error:`, error.message);
        console.error(`${label} Error stack:`, error.stack);
    });
    
    // Set a timeout
    detailsReq.setTimeout(10000, () => {
        console.error(`${label} Request timed out after 10 seconds`);
        detailsReq.destroy();
    });
    
    console.log(`Sending ${label} request...`);
    detailsReq.end();
    console.log(`${label} Request sent`);
} 