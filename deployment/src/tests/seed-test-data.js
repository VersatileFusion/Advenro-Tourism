const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seedTestData() {
    try {
        // Connect to the test database
        await mongoose.connect('mongodb://localhost:27017/tourism_test', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to test database');

        // Clear existing data
        await mongoose.connection.dropDatabase();
        console.log('Cleared existing data');

        // Get models
        const { User, Hotel } = require('../server/models');

        // Create test users
        const users = [
            {
                email: 'admin@test.com',
                password: await bcrypt.hash('Admin123!', 10),
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin'
            },
            {
                email: 'owner@test.com',
                password: await bcrypt.hash('Owner123!', 10),
                firstName: 'Hotel',
                lastName: 'Owner',
                role: 'hotel_owner'
            },
            {
                email: 'user@test.com',
                password: await bcrypt.hash('User123!', 10),
                firstName: 'Regular',
                lastName: 'User',
                role: 'user'
            }
        ];

        const createdUsers = await User.create(users);
        console.log('Created test users');

        // Create test hotels
        const hotels = [
            {
                name: 'Luxury Resort',
                description: 'A 5-star luxury resort with ocean views',
                location: {
                    coordinates: [40.7128, -74.0060],
                    country: 'USA',
                    city: 'New York',
                    address: '123 Luxury Ave'
                },
                owner: createdUsers[1]._id,
                category: 'resort',
                rating: 4.8,
                price: 500,
                starRating: 5,
                contactInfo: {
                    phone: '+1234567890',
                    email: 'info@luxuryresort.com',
                    website: 'https://luxuryresort.com'
                },
                policies: {
                    checkIn: '14:00',
                    checkOut: '12:00',
                    cancellation: '24 hours before check-in',
                    houseRules: ['No smoking', 'No pets']
                },
                amenities: ['wifi', 'pool', 'spa', 'gym', 'restaurant', 'bar'],
                rooms: [
                    {
                        name: 'Ocean Suite',
                        type: 'suite',
                        capacity: 4,
                        price: 800,
                        description: 'Luxury suite with ocean view',
                        amenities: ['wifi', 'minibar', 'tv'],
                        size: 50,
                        bedType: 'King',
                        availability: {
                            startDate: new Date(),
                            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                            quantity: 5
                        }
                    },
                    {
                        name: 'Garden Room',
                        type: 'double',
                        capacity: 2,
                        price: 300,
                        description: 'Cozy room with garden view',
                        amenities: ['wifi', 'tv'],
                        size: 30,
                        bedType: 'Queen',
                        availability: {
                            startDate: new Date(),
                            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                            quantity: 10
                        }
                    }
                ]
            },
            {
                name: 'Business Hotel',
                description: 'Perfect for business travelers',
                location: {
                    coordinates: [51.5074, -0.1278],
                    country: 'UK',
                    city: 'London',
                    address: '456 Business St'
                },
                owner: createdUsers[1]._id,
                category: 'hotel',
                rating: 4.5,
                price: 300,
                starRating: 4,
                contactInfo: {
                    phone: '+44123456789',
                    email: 'info@businesshotel.com',
                    website: 'https://businesshotel.com'
                },
                policies: {
                    checkIn: '15:00',
                    checkOut: '11:00',
                    cancellation: '48 hours before check-in',
                    houseRules: ['No smoking']
                },
                amenities: ['wifi', 'air-conditioning', 'minibar'],
                rooms: [
                    {
                        name: 'Executive Suite',
                        type: 'suite',
                        capacity: 2,
                        price: 500,
                        description: 'Perfect for business executives',
                        amenities: ['wifi', 'minibar', 'tv'],
                        size: 40,
                        bedType: 'King',
                        availability: {
                            startDate: new Date(),
                            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                            quantity: 8
                        }
                    }
                ]
            }
        ];

        await Hotel.create(hotels);
        console.log('Created test hotels');

        console.log('Test data seeded successfully');
    } catch (error) {
        console.error('Error seeding test data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database');
    }
}

// Run the seeding function
seedTestData(); 