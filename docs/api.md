# API Documentation

## Base URL
```
Development: http://localhost:3000/api
Production: https://api.tourismapi.com
```

## Authentication

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "subscribeNewsletter": true
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  }
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  }
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

## Hotels

### Get All Hotels
```http
GET /hotels
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sort` (optional): Sort field (e.g., "price", "-rating")
- `location` (optional): Filter by location
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price
- `rating` (optional): Minimum rating

**Response:**
```json
{
  "success": true,
  "count": 100,
  "pagination": {
    "current": 1,
    "total": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "data": [
    {
      "id": "hotel_id",
      "name": "Luxury Hotel",
      "description": "Beautiful hotel with ocean view",
      "location": {
        "city": "Miami",
        "country": "USA",
        "coordinates": {
          "lat": 25.7617,
          "lng": -80.1918
        }
      },
      "price": 299.99,
      "rating": 4.5,
      "amenities": ["wifi", "pool", "spa"],
      "images": ["image1.jpg", "image2.jpg"]
    }
  ]
}
```

### Get Hotel by ID
```http
GET /hotels/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "hotel_id",
    "name": "Luxury Hotel",
    "description": "Beautiful hotel with ocean view",
    "location": {
      "city": "Miami",
      "country": "USA",
      "coordinates": {
        "lat": 25.7617,
        "lng": -80.1918
      }
    },
    "price": 299.99,
    "rating": 4.5,
    "amenities": ["wifi", "pool", "spa"],
    "images": ["image1.jpg", "image2.jpg"],
    "reviews": [
      {
        "id": "review_id",
        "user": {
          "id": "user_id",
          "name": "John Doe"
        },
        "rating": 5,
        "comment": "Excellent stay!",
        "createdAt": "2024-03-12T10:00:00Z"
      }
    ]
  }
}
```

## Bookings

### Create Booking
```http
POST /bookings
Authorization: Bearer jwt_token_here
```

**Request Body:**
```json
{
  "hotelId": "hotel_id",
  "checkIn": "2024-04-01",
  "checkOut": "2024-04-05",
  "guests": {
    "adults": 2,
    "children": 1
  },
  "roomType": "deluxe",
  "specialRequests": "Late check-in"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "booking_id",
    "hotel": {
      "id": "hotel_id",
      "name": "Luxury Hotel"
    },
    "checkIn": "2024-04-01",
    "checkOut": "2024-04-05",
    "guests": {
      "adults": 2,
      "children": 1
    },
    "roomType": "deluxe",
    "totalPrice": 1199.96,
    "status": "confirmed",
    "paymentStatus": "pending"
  }
}
```

### Get User Bookings
```http
GET /bookings
Authorization: Bearer jwt_token_here
```

**Query Parameters:**
- `status` (optional): Filter by status (confirmed, cancelled, completed)
- `sort` (optional): Sort field (e.g., "checkIn", "-createdAt")

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "booking_id",
      "hotel": {
        "id": "hotel_id",
        "name": "Luxury Hotel"
      },
      "checkIn": "2024-04-01",
      "checkOut": "2024-04-05",
      "guests": {
        "adults": 2,
        "children": 1
      },
      "roomType": "deluxe",
      "totalPrice": 1199.96,
      "status": "confirmed",
      "paymentStatus": "pending"
    }
  ]
}
```

## Reviews

### Create Review
```http
POST /reviews
Authorization: Bearer jwt_token_here
```

**Request Body:**
```json
{
  "hotelId": "hotel_id",
  "rating": 5,
  "comment": "Excellent stay!",
  "images": ["base64_image_1"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "review_id",
    "hotel": {
      "id": "hotel_id",
      "name": "Luxury Hotel"
    },
    "user": {
      "id": "user_id",
      "name": "John Doe"
    },
    "rating": 5,
    "comment": "Excellent stay!",
    "images": ["image1.jpg"],
    "createdAt": "2024-03-12T10:00:00Z"
  }
}
```

## Payments

### Create Payment Intent
```http
POST /payments/intent
Authorization: Bearer jwt_token_here
```

**Request Body:**
```json
{
  "bookingId": "booking_id",
  "paymentMethod": "card"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientSecret": "stripe_client_secret",
    "amount": 1199.96,
    "currency": "usd"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid input data",
  "details": {
    "email": "Please provide a valid email address"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- 100 requests per 10 minutes for public endpoints
- 1000 requests per 10 minutes for authenticated endpoints

Rate limit headers are included in all responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1583858400
```

## Pagination

Paginated endpoints return metadata in the following format:
```json
{
  "success": true,
  "count": 100,
  "pagination": {
    "current": 1,
    "total": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "data": []
}
```

## Filtering

Many endpoints support filtering using query parameters:

```http
GET /hotels?location=Miami&minPrice=100&maxPrice=300&rating=4
```

## Sorting

Sort results using the `sort` parameter:
- Prefix with `-` for descending order
- Multiple sort fields separated by comma

```http
GET /hotels?sort=-rating,price
```

## CORS

The API supports CORS for the following origins:
- `http://localhost:3000`
- `https://tourismapi.com`
- `https://admin.tourismapi.com`

## Security

- All endpoints use HTTPS
- Authentication using JWT tokens
- CSRF protection for mutations
- Rate limiting
- Input validation and sanitization
- Security headers (HSTS, CSP, etc.)

## Webhooks

The API provides webhooks for real-time updates:

### Booking Updates
```http
POST /webhooks/bookings
```

**Payload:**
```json
{
  "type": "booking.confirmed",
  "data": {
    "bookingId": "booking_id",
    "status": "confirmed",
    "timestamp": "2024-03-12T10:00:00Z"
  }
}
```

## WebSocket Events

Real-time events are available through WebSocket connection:

```javascript
const ws = new WebSocket('wss://api.tourismapi.com/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle different event types
  switch(data.type) {
    case 'booking.updated':
      // Handle booking update
      break;
    case 'notification.new':
      // Handle new notification
      break;
  }
};
``` 