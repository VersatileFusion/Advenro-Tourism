const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Hotel:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - price
 *         - location
 *       properties:
 *         name:
 *           type: string
 *           description: Hotel name
 *         description:
 *           type: string
 *           description: Hotel description
 *         price:
 *           type: number
 *           description: Price per night
 *         location:
 *           type: object
 *           properties:
 *             address:
 *               type: string
 *             city:
 *               type: string
 *             country:
 *               type: string
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *         rating:
 *           type: number
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         rooms:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               price:
 *                 type: number
 *               capacity:
 *                 type: number
 */

const hotelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a hotel name'],
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    price: {
        type: Number,
        required: [true, 'Please add a price per night']
    },
    location: {
        address: {
            type: String,
            required: [true, 'Please add an address']
        },
        city: {
            type: String,
            required: [true, 'Please add a city']
        },
        country: {
            type: String,
            required: [true, 'Please add a country']
        },
        coordinates: {
            type: [Number],
            required: [true, 'Please add coordinates'],
            index: '2dsphere'
        }
    },
    amenities: {
        type: [String],
        default: []
    },
    rating: {
        type: Number,
        min: [0, 'Rating must be at least 0'],
        max: [5, 'Rating cannot be more than 5'],
        default: 0
    },
    images: {
        type: [String],
        default: ['default-hotel.jpg']
    },
    rooms: [{
        type: {
            type: String,
            required: [true, 'Please specify room type']
        },
        price: {
            type: Number,
            required: [true, 'Please specify room price']
        },
        capacity: {
            type: Number,
            required: [true, 'Please specify room capacity']
        },
        available: {
            type: Boolean,
            default: true
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create index for location-based queries
hotelSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('Hotel', hotelSchema); 