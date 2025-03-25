const mongoose = require('mongoose');
const { User, Tour, Hotel, Flight, Booking, Review, AuditLog, SystemConfig, ErrorLog, Notification } = require('../models');

// Connect to MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/advenro';
console.log('Connecting to MongoDB at:', MONGODB_URI);
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(async () => {
    console.log('MongoDB Connected successfully');
    
    // Get counts for each collection
    try {
        const userCount = await User.countDocuments();
        console.log(`Users: ${userCount}`);
        
        if (userCount > 0) {
            // Show sample user data
            const users = await User.find().limit(3);
            console.log('Sample users:');
            users.forEach(user => {
                console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);
            });
        }
        
        const hotelCount = await Hotel.countDocuments();
        console.log(`Hotels: ${hotelCount}`);
        
        if (hotelCount > 0) {
            // Show sample hotel data
            const hotels = await Hotel.find().limit(3);
            console.log('Sample hotels:');
            hotels.forEach(hotel => {
                console.log(`- ${hotel.name} - Price: ${hotel.price}, Rating: ${hotel.rating}`);
            });
        }
        
        const tourCount = await Tour.countDocuments();
        console.log(`Tours: ${tourCount}`);
        
        if (tourCount > 0) {
            // Show sample tour data
            const tours = await Tour.find().limit(3);
            console.log('Sample tours:');
            tours.forEach(tour => {
                console.log(`- ${tour.name} - Price: ${tour.price}, Duration: ${tour.duration} days`);
            });
        }
        
        const flightCount = await Flight.countDocuments();
        console.log(`Flights: ${flightCount}`);
        
        const bookingCount = await Booking.countDocuments();
        console.log(`Bookings: ${bookingCount}`);
        
        const reviewCount = await Review.countDocuments();
        console.log(`Reviews: ${reviewCount}`);
        
        const auditLogCount = await AuditLog.countDocuments();
        console.log(`Audit Logs: ${auditLogCount}`);
        
        const errorLogCount = await ErrorLog.countDocuments();
        console.log(`Error Logs: ${errorLogCount}`);
        
        const notificationCount = await Notification.countDocuments();
        console.log(`Notifications: ${notificationCount}`);
        
    } catch (error) {
        console.error('Error getting data counts:', error);
    } finally {
        // Close connection
        mongoose.disconnect();
        console.log('MongoDB disconnected');
    }
})
.catch(err => {
    console.error('Failed to connect to MongoDB:', err);
}); 