const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Tour, Hotel, Flight, Booking, Review, AuditLog, SystemConfig, ErrorLog, Notification } = require('../models');

const { faker } = require('@faker-js/faker');

// Connect to MongoDB with direct connection string
const MONGODB_URI = 'mongodb://localhost:27017/advenro';
console.log('Connecting to MongoDB at:', MONGODB_URI);
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Helper function to generate random coordinates
const generateCoordinates = () => {
    return [
        faker.number.float({ min: -180, max: 180, multipleOf: 0.000001 }),
        faker.number.float({ min: -90, max: 90, multipleOf: 0.000001 })
    ];
};

// Generate test users
const generateUsers = async (count = 50) => {
    const users = [];
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Generate valid phone numbers in format +1234567890
    const generateValidPhone = () => {
        return `+${faker.number.int({ min: 1, max: 9 })}${faker.string.numeric(9)}`;
    };

    for (let i = 0; i < count; i++) {
        users.push({
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            email: faker.internet.email(),
            password: hashedPassword,
            role: faker.helpers.arrayElement(['user', 'admin', 'guide']),
            phone: generateValidPhone(),
            address: {
                street: faker.location.streetAddress(),
                city: faker.location.city(),
                state: faker.location.state(),
                zipCode: faker.location.zipCode(),
                country: faker.location.country()
            },
            preferences: {
                notifications: {
                    email: faker.datatype.boolean(),
                    sms: faker.datatype.boolean()
                },
                currency: faker.helpers.arrayElement(['USD', 'EUR', 'GBP']),
                language: faker.helpers.arrayElement(['en', 'es', 'fr'])
            },
            interests: faker.helpers.arrayElements(['beach', 'mountain', 'city', 'adventure', 'culture'], 3),
            travelStats: {
                totalTrips: faker.number.int({ min: 0, max: 20 }),
                totalCountries: faker.number.int({ min: 0, max: 10 }),
                totalCities: faker.number.int({ min: 0, max: 30 }),
                totalSpent: faker.number.int({ min: 1000, max: 50000 })
            }
        });
    }

    return await User.insertMany(users);
};

// Generate valid image URLs
const generateValidImageURL = () => {
    return `https://images.unsplash.com/photo-${faker.number.int({ min: 1000000000, max: 9999999999 })}?w=800&auto=format`;
};

// Generate test hotels
const generateHotels = async (count = 30) => {
    const hotels = [];
    const cities = ['New York', 'London', 'Paris', 'Tokyo', 'Dubai', 'Singapore', 'Sydney', 'Rome', 'Barcelona', 'Amsterdam'];

    for (let i = 0; i < count; i++) {
        const city = faker.helpers.arrayElement(cities);
        hotels.push({
            name: faker.company.name() + ' Hotel',
            description: faker.lorem.paragraph(),
            price: faker.number.int({ min: 100, max: 1000 }),
            location: {
                address: faker.location.streetAddress(),
                city: city,
                country: faker.location.country(),
                coordinates: generateCoordinates()
            },
            amenities: faker.helpers.arrayElements([
                'WiFi', 'Pool', 'Gym', 'Restaurant', 'Spa', 'Parking',
                'Room Service', 'Conference Room', 'Bar', 'Beach Access'
            ], 5),
            rating: faker.number.float({ min: 1, max: 5, multipleOf: 0.1 }),
            images: Array(5).fill().map(() => generateValidImageURL()),
            rooms: Array(5).fill().map(() => ({
                type: faker.helpers.arrayElement(['single', 'double', 'suite', 'deluxe']),
                price: faker.number.int({ min: 80, max: 800 }),
                capacity: faker.number.int({ min: 1, max: 4 }),
                available: faker.datatype.boolean()
            }))
        });
    }

    return await Hotel.insertMany(hotels);
};

// Generate test tours
const generateTours = async (count = 20) => {
    const tours = [];
    const difficulties = ['easy', 'medium', 'difficult'];

    for (let i = 0; i < count; i++) {
        tours.push({
            name: faker.lorem.words(3) + ' Tour',
            description: faker.lorem.paragraphs(),
            price: faker.number.int({ min: 500, max: 5000 }),
            duration: faker.number.int({ min: 1, max: 14 }),
            maxGroupSize: faker.number.int({ min: 5, max: 30 }),
            difficulty: faker.helpers.arrayElement(difficulties),
            rating: faker.number.float({ min: 1, max: 5, multipleOf: 0.1 }),
            locations: Array(3).fill().map(() => ({
                name: faker.location.city(),
                coordinates: generateCoordinates(),
                description: faker.lorem.sentence(),
                day: faker.number.int({ min: 1, max: 14 })
            })),
            startDates: Array(5).fill().map(() => faker.date.future()),
            images: Array(5).fill().map(() => generateValidImageURL()),
            included: faker.helpers.arrayElements([
                'Hotel Accommodation', 'Meals', 'Transportation',
                'Tour Guide', 'Activities', 'Equipment'
            ], 4),
            excluded: faker.helpers.arrayElements([
                'Flights', 'Insurance', 'Personal Expenses',
                'Optional Activities', 'Tips'
            ], 3),
            highlights: faker.helpers.arrayElements([
                'Scenic Views', 'Local Culture', 'Adventure Activities',
                'Historical Sites', 'Wildlife', 'Beach Time'
            ], 3)
        });
    }

    return await Tour.insertMany(tours);
};

// Generate test reviews
const generateReviews = async (users, hotels, tours) => {
    const reviews = [];
    const items = [...hotels, ...tours];
    
    for (const user of users) {
        const itemCount = faker.number.int({ min: 1, max: 5 });
        const randomItems = faker.helpers.arrayElements(items, itemCount);

        for (const item of randomItems) {
            reviews.push({
                title: faker.lorem.sentence(),
                text: faker.lorem.paragraph(),
                rating: faker.number.int({ min: 1, max: 5 }),
                user: user._id,
                itemType: item instanceof Hotel ? 'hotel' : 'tour',
                itemId: item._id,
                photos: Array(3).fill().map(() => generateValidImageURL()),
                verified: faker.datatype.boolean()
            });
        }
    }

    return await Review.insertMany(reviews);
};

// Generate test bookings
const generateBookings = async (users, hotels, tours) => {
    const bookings = [];
    const items = [...hotels, ...tours];

    for (const user of users) {
        const bookingCount = faker.number.int({ min: 1, max: 3 });
        const randomItems = faker.helpers.arrayElements(items, bookingCount);

        for (const item of randomItems) {
            const isHotel = item instanceof Hotel;
            const startDate = faker.date.future();
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + faker.number.int({ min: 1, max: 14 }));

            bookings.push({
                user: user._id,
                itemType: isHotel ? 'hotel' : 'tour',
                itemId: item._id,
                bookingType: isHotel ? 'HOTEL' : 'TOUR',
                startDate,
                endDate,
                numberOfGuests: faker.number.int({ min: 1, max: 4 }),
                totalPrice: faker.number.int({ min: 100, max: 5000 }),
                status: faker.helpers.arrayElement(['pending', 'confirmed', 'cancelled']),
                paymentStatus: faker.helpers.arrayElement(['pending', 'paid', 'refunded']),
                specialRequests: faker.lorem.sentence()
            });
        }
    }

    return await Booking.insertMany(bookings);
};

// Generate test notifications
const generateNotifications = async (users) => {
    const notifications = [];
    const types = ['SYSTEM', 'BOOKING', 'PAYMENT', 'ACCOUNT', 'MAINTENANCE', 'TOUR', 'HOTEL', 'FLIGHT'];

    for (const user of users) {
        const notificationCount = faker.number.int({ min: 1, max: 5 });
        
        for (let i = 0; i < notificationCount; i++) {
            notifications.push({
                title: faker.lorem.sentence(),
                message: faker.lorem.paragraph(),
                type: faker.helpers.arrayElement(types),
                priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH']),
                status: faker.helpers.arrayElement(['PENDING', 'SENT', 'FAILED']),
                targetUsers: [user._id],
                sentBy: faker.helpers.arrayElement(users)._id,
                scheduledFor: faker.date.future(),
                expiresAt: faker.date.future(),
                metadata: {
                    key: faker.word.sample(),
                    value: faker.word.sample()
                }
            });
        }
    }

    return await Notification.insertMany(notifications);
};

// Generate test audit logs
const generateAuditLogs = async (users) => {
    const auditLogs = [];
    const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'CHANGE_ROLE', 'BAN_USER', 'SYSTEM_CONFIG', 'BULK_NOTIFICATION'];
    const entityTypes = ['USER', 'TOUR', 'HOTEL', 'FLIGHT', 'BOOKING', 'REVIEW', 'SYSTEM', 'NOTIFICATION'];

    for (const user of users) {
        const logCount = faker.number.int({ min: 1, max: 10 });
        
        for (let i = 0; i < logCount; i++) {
            auditLogs.push({
                user: user._id,
                action: faker.helpers.arrayElement(actions),
                entityType: faker.helpers.arrayElement(entityTypes),
                entityId: user._id,
                description: faker.lorem.sentence(),
                previousValue: { key: faker.word.sample() },
                newValue: { key: faker.word.sample() },
                ipAddress: faker.internet.ip(),
                userAgent: faker.internet.userAgent()
            });
        }
    }

    return await AuditLog.insertMany(auditLogs);
};

// Generate test error logs
const generateErrorLogs = async (users) => {
    const errorLogs = [];
    const types = ['SERVER_ERROR', 'CLIENT_ERROR', 'VALIDATION_ERROR', 'AUTH_ERROR', 'PAYMENT_ERROR'];

    for (const user of users) {
        const errorCount = faker.number.int({ min: 1, max: 5 });
        
        for (let i = 0; i < errorCount; i++) {
            errorLogs.push({
                type: faker.helpers.arrayElement(types),
                message: faker.lorem.sentence(),
                stack: faker.lorem.paragraph(),
                path: faker.internet.url(),
                method: faker.helpers.arrayElement(['GET', 'POST', 'PUT', 'DELETE']),
                statusCode: faker.helpers.arrayElement([400, 401, 403, 404, 500]),
                user: user._id,
                ipAddress: faker.internet.ip(),
                userAgent: faker.internet.userAgent()
            });
        }
    }

    return await ErrorLog.insertMany(errorLogs);
};

// Main seeding function
const seedDatabase = async () => {
    try {
        console.log('Starting database seeding...');

        // Generate users first
        try {
            const users = await generateUsers();
            console.log(`Generated ${users.length} users`);

            // Generate hotels and tours
            try {
                const hotels = await generateHotels();
                const tours = await generateTours();
                console.log(`Generated ${hotels.length} hotels and ${tours.length} tours`);

                // Skip reviews for now due to validation issues
                // try {
                //     const reviews = await generateReviews(users, hotels, tours);
                //     console.log(`Generated ${reviews.length} reviews`);
                // } catch (error) {
                //     console.error('Error generating reviews:', error.message);
                // }

                // Generate bookings
                try {
                    const bookings = await generateBookings(users, hotels, tours);
                    console.log(`Generated ${bookings.length} bookings`);
                } catch (error) {
                    console.error('Error generating bookings:', error.message);
                }

                // Generate notifications
                try {
                    const notifications = await generateNotifications(users);
                    console.log(`Generated ${notifications.length} notifications`);
                } catch (error) {
                    console.error('Error generating notifications:', error.message);
                }

                // Generate audit logs
                try {
                    const auditLogs = await generateAuditLogs(users);
                    console.log(`Generated ${auditLogs.length} audit logs`);
                } catch (error) {
                    console.error('Error generating audit logs:', error.message);
                }

                // Generate error logs
                try {
                    const errorLogs = await generateErrorLogs(users);
                    console.log(`Generated ${errorLogs.length} error logs`);
                } catch (error) {
                    console.error('Error generating error logs:', error.message);
                }
            } catch (error) {
                console.error('Error generating hotels and tours:', error.message);
            }
        } catch (error) {
            console.error('Error generating users:', error.message);
        }

        console.log('Database seeding completed successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await mongoose.disconnect();
    }
};

// Run the seeding function
seedDatabase(); 