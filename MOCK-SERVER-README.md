# Booking.com API Mock Server

This is a mock server that simulates the Booking.com API responses for local development and testing. It's particularly useful when you're unable to access the real Booking.com API through RapidAPI due to regional restrictions or other limitations.

## Features

- Provides mock responses for key Booking.com API endpoints
- Follows the same API structure and response format as the real API
- Supports both the direct Booking.com API paths and our application's path structure
- Includes simulated latency for more realistic API behavior
- Offers health check and test endpoints for verifying server status

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone this repository or copy the mock server files to your project directory:
   - `mock-server.js`: The main mock server implementation
   - `test-mock-server.js`: Test script to verify the mock server is working

2. Install the required dependencies:

```bash
npm install express morgan cors
```

### Running the Server

Start the mock server by running:

```bash
node mock-server.js
```

The server will start on http://localhost:3030 and will output information about available endpoints.

### Testing the Server

To verify the mock server is working correctly, run:

```bash
node test-mock-server.js
```

This will test all the implemented endpoints and show the results.

## Endpoints

The mock server implements the following endpoints:

### Direct Booking.com API Paths

- `/v1/hotels/search`: Search for hotels based on location and dates
- `/v1/hotels/:id`: Get detailed information about a specific hotel
- `/v1/locations`: Search for locations (cities, countries)

### Application Paths

- `/api/v1/booking/hotels/search`: Search for hotels based on location and dates
- `/api/v1/booking/hotels/:id`: Get detailed information about a specific hotel
- `/api/v1/booking/locations`: Search for locations (cities, countries)

### Utility Endpoints

- `/health`: Health check endpoint
- `/test`: Test endpoint to verify the server is running

## Mock Data

The server provides mock data for:

- Hotel search results (2 sample hotels)
- Hotel details for specific hotel IDs (123456 and 789012)
- Location search results (London, Paris, New York)

## Integration with Your Application

To use this mock server in your application:

1. Update your API client to point to `http://localhost:3030` instead of the real API endpoint
2. Make sure your application uses the same path structure (/api/v1/booking/...)
3. All the expected response formats match the real API

## Customizing the Mock Data

To add more mock data or modify existing data:

1. Edit the `mockHotelSearch`, `hotelDetails`, and `mockLocations` objects in `mock-server.js`
2. Implement additional endpoints as needed following the same pattern

## Limitations

- Limited dataset (only a few sample hotels and locations)
- No authentication or rate limiting
- Simplified response structure compared to the real API
- No filtering or sorting functionality (returns the same results regardless of query parameters)

## Troubleshooting

- **Port conflicts**: If port 3030 is already in use, change the PORT constant in `mock-server.js`
- **CORS issues**: The server has CORS enabled, but you may need to adjust the configuration
- **Missing endpoints**: If you need additional endpoints, add them following the same pattern

## License

This mock server is provided as-is for development and testing purposes. 