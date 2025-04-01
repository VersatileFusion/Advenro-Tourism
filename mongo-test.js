const mongoose = require('mongoose');
require('dotenv').config();

// Define a simple hotel schema directly
const hotelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    location: { 
        address: { type: String, required: true },
        city: { type: String, required: true },
        country: { type: String, required: true },
        coordinates: { type: [Number], required: true }
    },
    amenities: [String],
    rating: { type: Number, default: 0 },
    images: [String],
    rooms: [{
        type: { type: String, required: true },
        price: { type: Number, required: true },
        capacity: { type: Number, required: true },
        available: { type: Boolean, default: true }
    }]
});

// Sample hotel data
const sampleHotels = [
    {
        name: 'Grand Hotel New York',
        description: 'Luxury hotel in the heart of Manhattan',
        price: 299,
        location: {
            address: '123 Broadway',
            city: 'New York',
            country: 'USA',
            coordinates: [-74.0060, 40.7128]
        },
        amenities: ['Free WiFi', 'Swimming Pool', 'Spa', 'Gym', 'Restaurant'],
        rating: 4.7,
        images: ['hotel1.jpg', 'hotel1-room.jpg', 'hotel1-pool.jpg'],
        rooms: [
            {
                type: 'Standard',
                price: 299,
                capacity: 2,
                available: true
            },
            {
                type: 'Deluxe',
                price: 399,
                capacity: 3,
                available: true
            },
            {
                type: 'Suite',
                price: 599,
                capacity: 4,
                available: true
            }
        ]
    }
];

async function testMongoDB() {
    try {
        // Connect to MongoDB
        console.log('Attempting to connect to MongoDB...');
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/advenro';
        console.log(`Using connection string: ${mongoURI}`);
        
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Create the Hotel model
        console.log('Creating Hotel model...');
        let HotelModel;
        try {
            HotelModel = mongoose.model('Hotel');
            console.log('Using existing Hotel model');
        } catch (e) {
            HotelModel = mongoose.model('Hotel', hotelSchema);
            console.log('Created new Hotel model');
        }
        
        // Count existing hotels
        const count = await HotelModel.countDocuments();
        console.log(`Found ${count} existing hotels`);
        
        // Insert sample hotel data
        if (count === 0) {
            console.log('Inserting sample hotel data...');
            const result = await HotelModel.create(sampleHotels);
            console.log(`✅ Successfully inserted ${result.length} hotels`);
        } else {
            console.log('Database already has hotels, skipping seed');
        }
        
        // Get all hotels
        const hotels = await HotelModel.find();
        console.log(`Total hotels in database: ${hotels.length}`);
        
        // Close the connection
        await mongoose.connection.close();
        console.log('Connection closed');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Run the test
testMongoDB(); 