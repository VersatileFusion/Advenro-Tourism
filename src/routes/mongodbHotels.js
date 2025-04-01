const express = require('express');
const router = express.Router();
const { getMongoDBHotels } = require('../controllers/hotelController');
const { Hotel } = require('../models');

/**
 * @swagger
 * /api/v1/mongodb-hotels:
 *   get:
 *     summary: Get all MongoDB hotels
 *     tags: [Hotels]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of hotels to return (default 100)
 *     responses:
 *       200:
 *         description: List of all MongoDB hotels
 */
router.get('/', getMongoDBHotels);

/**
 * @swagger
 * /api/v1/mongodb-hotels/seed:
 *   post:
 *     summary: Seed the database with sample hotels
 *     tags: [Hotels]
 *     responses:
 *       200:
 *         description: Hotels created successfully
 */
router.post('/seed', async (req, res) => {
    try {
        // First check if hotels already exist
        const existingHotels = await Hotel.countDocuments();
        if (existingHotels > 0) {
            return res.json({
                success: true,
                message: `Database already has ${existingHotels} hotels. No seeding needed.`,
                count: existingHotels
            });
        }

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
            },
            {
                name: 'Seaside Resort Miami',
                description: 'Beachfront resort with stunning ocean views',
                price: 349,
                location: {
                    address: '789 Ocean Drive',
                    city: 'Miami',
                    country: 'USA',
                    coordinates: [-80.1300, 25.7907]
                },
                amenities: ['Beach Access', 'Swimming Pool', 'Spa', 'Water Sports', 'Restaurants'],
                rating: 4.5,
                images: ['hotel2.jpg', 'hotel2-beach.jpg', 'hotel2-room.jpg'],
                rooms: [
                    {
                        type: 'Ocean View',
                        price: 349,
                        capacity: 2,
                        available: true
                    },
                    {
                        type: 'Beachfront Villa',
                        price: 699,
                        capacity: 5,
                        available: true
                    }
                ]
            },
            {
                name: 'Mountain Retreat Colorado',
                description: 'Cozy mountain lodge with spectacular mountain views',
                price: 249,
                location: {
                    address: '456 Mountain Road',
                    city: 'Aspen',
                    country: 'USA',
                    coordinates: [-106.8175, 39.1911]
                },
                amenities: ['Fireplace', 'Hiking Trails', 'Ski Storage', 'Hot Tub', 'Restaurant'],
                rating: 4.8,
                images: ['hotel3.jpg', 'hotel3-mountain.jpg', 'hotel3-room.jpg'],
                rooms: [
                    {
                        type: 'Mountain View',
                        price: 249,
                        capacity: 2,
                        available: true
                    },
                    {
                        type: 'Luxury Cabin',
                        price: 499,
                        capacity: 4,
                        available: true
                    }
                ]
            }
        ];

        // Insert the sample hotels
        const hotels = await Hotel.create(sampleHotels);
        
        res.status(201).json({
            success: true,
            message: `Successfully seeded ${hotels.length} hotels`,
            count: hotels.length,
            data: hotels
        });
    } catch (error) {
        console.error('Error seeding hotels:', error);
        res.status(500).json({
            success: false,
            message: 'Error seeding hotels',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/v1/mongodb-hotels/{id}:
 *   get:
 *     summary: Get hotel by ID
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel ID
 *     responses:
 *       200:
 *         description: Hotel details
 *       404:
 *         description: Hotel not found
 */
router.get('/:id', async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }
        
        res.json({
            success: true,
            data: hotel
        });
    } catch (error) {
        console.error('Error getting hotel details:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router; 