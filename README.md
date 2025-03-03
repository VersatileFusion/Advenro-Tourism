# Tourism Booking API

A comprehensive tourism booking API built with Node.js, Express, and MongoDB. This API provides endpoints for managing hotels, flights, tours, user profiles, reviews, and bookings with features like two-factor authentication, notifications, and file uploads.

## 🚀 Features

### User Management
- User registration and authentication
- JWT-based authorization
- Two-factor authentication (2FA)
- Profile management with avatar upload
- Email verification
- Password reset functionality
- Social media profile integration
- Travel statistics tracking
- Preferences management

### Booking System
- Hotel bookings
- Flight reservations
- Tour bookings
- Booking status management
- Payment integration
- Booking history
- Cancellation handling

### Review System
- Create, read, update, delete reviews
- Rating system
- Photo uploads for reviews
- Like/unlike reviews
- Verified booking reviews
- Average rating calculation

### Notification System
- Email notifications
- SMS notifications
- Web push notifications
- Customizable notification preferences
- Multiple notification templates

### Security Features
- JWT authentication
- Two-factor authentication
- Rate limiting
- Request validation
- Input sanitization
- Account locking
- Session management

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/tourism-api.git
cd tourism-api
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create environment files:
   - Create \`config.env\` in \`src/config/\` for production
   - Use \`test.env\` for testing

4. Set up environment variables:
\`\`\`env
NODE_ENV=development
PORT=3000

# MongoDB
MONGO_URI=your_mongodb_uri

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# Email
SMTP_HOST=your_smtp_host
SMTP_PORT=2525
SMTP_EMAIL=your_email
SMTP_PASSWORD=your_password
FROM_EMAIL=noreply@tourism.com
FROM_NAME=Tourism App

# File Upload
MAX_FILE_UPLOAD=2000000
FILE_UPLOAD_PATH=./public/uploads

# Two-Factor Authentication
VAPID_EMAIL=your_email
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key

# SMS
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
\`\`\`

5. Start the server:
\`\`\`bash
# Development
npm run dev

# Production
npm start
\`\`\`

## 🧪 Testing

Run the test suite:
\`\`\`bash
npm test
\`\`\`

## 📚 API Documentation

Full API documentation is available at \`/api-docs\` when the server is running.

### Main Endpoints

#### Authentication
- \`POST /api/v1/auth/register\` - Register user
- \`POST /api/v1/auth/login\` - Login user
- \`GET /api/v1/auth/logout\` - Logout user
- \`POST /api/v1/auth/forgotpassword\` - Request password reset
- \`PUT /api/v1/auth/resetpassword/:token\` - Reset password

#### User Profile
- \`GET /api/v1/users/me\` - Get current user
- \`PUT /api/v1/users/profile\` - Update profile
- \`PUT /api/v1/users/email\` - Update email
- \`PUT /api/v1/users/password\` - Update password
- \`PUT /api/v1/users/avatar\` - Upload avatar
- \`POST /api/v1/users/2fa/setup\` - Setup 2FA
- \`PUT /api/v1/users/2fa/enable\` - Enable 2FA

#### Hotels
- \`GET /api/v1/hotels\` - Get all hotels
- \`GET /api/v1/hotels/:id\` - Get single hotel
- \`POST /api/v1/hotels\` - Create hotel
- \`PUT /api/v1/hotels/:id\` - Update hotel
- \`DELETE /api/v1/hotels/:id\` - Delete hotel

#### Reviews
- \`GET /api/v1/reviews\` - Get all reviews
- \`GET /api/v1/:itemType/:itemId/reviews\` - Get item reviews
- \`POST /api/v1/:itemType/:itemId/reviews\` - Create review
- \`PUT /api/v1/reviews/:id\` - Update review
- \`DELETE /api/v1/reviews/:id\` - Delete review
- \`PUT /api/v1/reviews/:id/like\` - Like/unlike review

## 🔒 Security

- All passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Input validation and sanitization
- Rate limiting on sensitive routes
- Security headers with helmet
- CORS enabled
- Two-factor authentication available

## 📱 Notification Channels

### Email
- Welcome emails
- Booking confirmations
- Password reset
- Email verification
- Travel reminders

### SMS
- Booking confirmations
- Travel updates
- Security alerts
- Special offers

### Push Notifications
- Booking status updates
- Travel reminders
- Price alerts
- Special offers

## 🛡️ Error Handling

The API uses a centralized error handling system with proper HTTP status codes and error messages.

Example error response:
\`\`\`json
{
    "success": false,
    "error": "Resource not found",
    "code": "RESOURCE_NOT_FOUND",
    "statusCode": 404
}
\`\`\`

## 📊 Rate Limiting

- 100 requests per 10 minutes per IP
- Customizable rate limits for different routes
- Rate limit headers included in responses

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Node.js community
- Express.js team
- MongoDB team
- All contributors 