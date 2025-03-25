const http = require('http');

console.log('Starting mock API test...');

// Test the mock hotel search endpoint
const searchOptions = {
    method: 'GET',
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/booking/hotels/search?dest_id=London',
    headers: {
        'Accept': 'application/json'
    }
};

// Make the request to the mock hotel search endpoint
const req = http.request(searchOptions, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log('Response Headers:', JSON.stringify(res.headers, null, 2));
    
    const chunks = [];

    res.on('data', (chunk) => {
        chunks.push(chunk);
        console.log('Received chunk:', chunk.toString());
    });

    res.on('end', () => {
        console.log('Response complete');
        try {
            const body = Buffer.concat(chunks).toString();
            console.log('Raw response body:', body);
            
            const response = JSON.parse(body);
            console.log('Parsed Response:', JSON.stringify(response, null, 2));
            
            if (response.success && response.data && response.data.length > 0) {
                console.log(`Found ${response.data.length} hotels`);
                
                // Get details for the first hotel
                const hotelId = response.data[0].id;
                getHotelDetails(hotelId);
            } else {
                console.log('No hotels found in search results or unexpected response format');
            }
        } catch (error) {
            console.error('Error processing response:', error.message);
            console.log('Raw response:', Buffer.concat(chunks).toString());
        }
    });
});

req.on('error', (error) => {
    console.error('Request Error:', error.message);
});

console.log('Sending search request...');
req.end();

function getHotelDetails(hotelId) {
    const detailsOptions = {
        method: 'GET',
        hostname: 'localhost',
        port: 3001,
        path: `/api/v1/booking/hotels/${hotelId}`,
        headers: {
            'Accept': 'application/json'
        }
    };
    
    console.log(`Getting details for hotel ID: ${hotelId}`);
    
    const detailsReq = http.request(detailsOptions, (res) => {
        console.log(`Details Status Code: ${res.statusCode}`);
        console.log('Details Headers:', JSON.stringify(res.headers, null, 2));
        
        const chunks = [];
        
        res.on('data', (chunk) => {
            chunks.push(chunk);
            console.log('Received details chunk:', chunk.toString());
        });
        
        res.on('end', () => {
            console.log('Details response complete');
            try {
                const body = Buffer.concat(chunks).toString();
                const response = JSON.parse(body);
                console.log('Details Response:', JSON.stringify(response, null, 2));
                
                console.log('Hotel Details Test Complete');
            } catch (error) {
                console.error('Error parsing details response:', error.message);
                console.log('Raw details response:', Buffer.concat(chunks).toString());
            }
        });
    });
    
    detailsReq.on('error', (error) => {
        console.error('Details Request Error:', error.message);
    });
    
    console.log('Sending details request...');
    detailsReq.end();
} 