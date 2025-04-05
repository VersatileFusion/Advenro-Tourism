/**
 * Hotels Controller
 * Handles hotel-related requests
 */

// Mock hotels data
const hotels = [
  {
    id: 'hotel_1',
    name: 'Grand Resort & Spa',
    description: 'Luxury beachfront resort with full-service spa and ocean views.',
    address: '123 Beach Blvd, Miami, FL 33139',
    location: {
      latitude: 25.7617,
      longitude: -80.1918
    },
    rating: 4.8,
    amenities: ['Swimming Pool', 'Spa', 'Restaurant', 'Fitness Center', 'Free WiFi'],
    images: [
      'https://example.com/hotels/grand-resort-1.jpg',
      'https://example.com/hotels/grand-resort-2.jpg'
    ],
    pricePerNight: 299.99,
    currency: 'USD',
    featured: true
  },
  {
    id: 'hotel_2',
    name: 'City Central Hotel',
    description: 'Modern hotel located in the heart of downtown.',
    address: '456 Main St, New York, NY 10001',
    location: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    rating: 4.5,
    amenities: ['Free WiFi', 'Restaurant', 'Business Center', 'Fitness Center'],
    images: [
      'https://example.com/hotels/city-central-1.jpg',
      'https://example.com/hotels/city-central-2.jpg'
    ],
    pricePerNight: 199.99,
    currency: 'USD',
    featured: false
  }
];

// Mock rooms data
const rooms = {
  'hotel_1': [
    {
      id: 'room_1_1',
      type: 'Deluxe',
      description: 'Spacious room with ocean view',
      capacity: 2,
      amenities: ['King Bed', 'Ocean View', 'Mini Bar', 'Free WiFi'],
      price: 299.99,
      currency: 'USD',
      images: [
        'https://example.com/rooms/deluxe-1.jpg',
        'https://example.com/rooms/deluxe-2.jpg'
      ]
    },
    {
      id: 'room_1_2',
      type: 'Suite',
      description: 'Luxury suite with separate living area',
      capacity: 4,
      amenities: ['King Bed', 'Sofa Bed', 'Ocean View', 'Mini Bar', 'Free WiFi', 'Jacuzzi'],
      price: 499.99,
      currency: 'USD',
      images: [
        'https://example.com/rooms/suite-1.jpg',
        'https://example.com/rooms/suite-2.jpg'
      ]
    }
  ],
  'hotel_2': [
    {
      id: 'room_2_1',
      type: 'Standard',
      description: 'Comfortable room for business travelers',
      capacity: 2,
      amenities: ['Queen Bed', 'Desk', 'Free WiFi'],
      price: 199.99,
      currency: 'USD',
      images: [
        'https://example.com/rooms/standard-1.jpg',
        'https://example.com/rooms/standard-2.jpg'
      ]
    },
    {
      id: 'room_2_2',
      type: 'Executive',
      description: 'Upgraded room with city view',
      capacity: 2,
      amenities: ['King Bed', 'City View', 'Desk', 'Mini Bar', 'Free WiFi'],
      price: 259.99,
      currency: 'USD',
      images: [
        'https://example.com/rooms/executive-1.jpg',
        'https://example.com/rooms/executive-2.jpg'
      ]
    }
  ]
};

/**
 * Get all hotels
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getHotels = async (req, res, next) => {
  try {
    // Apply basic filtering if query params exist
    let filteredHotels = [...hotels];
    
    // Filter by price range
    if (req.query.minPrice || req.query.maxPrice) {
      const minPrice = parseFloat(req.query.minPrice) || 0;
      const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;
      
      filteredHotels = filteredHotels.filter(hotel => 
        hotel.pricePerNight >= minPrice && hotel.pricePerNight <= maxPrice
      );
    }
    
    // Filter by rating
    if (req.query.rating) {
      const minRating = parseFloat(req.query.rating);
      filteredHotels = filteredHotels.filter(hotel => hotel.rating >= minRating);
    }
    
    res.status(200).json({
      success: true,
      count: filteredHotels.length,
      data: filteredHotels
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search hotels
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.searchHotels = async (req, res, next) => {
  try {
    const { query, location, checkIn, checkOut, guests } = req.query;
    
    // Advanced search logic would be implemented here
    // For now, simple text search on name and description
    let searchResults = [...hotels];
    
    if (query) {
      const searchTerm = query.toLowerCase();
      searchResults = searchResults.filter(hotel => 
        hotel.name.toLowerCase().includes(searchTerm) || 
        hotel.description.toLowerCase().includes(searchTerm)
      );
    }
    
    res.status(200).json({
      success: true,
      count: searchResults.length,
      data: searchResults
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get featured hotels
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getFeaturedHotels = async (req, res, next) => {
  try {
    const featuredHotels = hotels.filter(hotel => hotel.featured);
    
    res.status(200).json({
      success: true,
      count: featuredHotels.length,
      data: featuredHotels
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get nearby hotels
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getNearbyHotels = async (req, res, next) => {
  try {
    const { latitude, longitude, radius } = req.query;
    
    // In a real implementation, would use geospatial calculations
    // Mock implementation returns all hotels with a mock distance
    const nearbyHotels = hotels.map(hotel => ({
      ...hotel,
      distance: Math.random() * 5 // Random distance in km
    })).sort((a, b) => a.distance - b.distance);
    
    res.status(200).json({
      success: true,
      count: nearbyHotels.length,
      data: nearbyHotels
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get hotel details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getHotelDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const hotel = hotels.find(h => h.id === id);
    
    if (!hotel) {
      const error = new Error('Hotel not found');
      error.status = 404;
      error.code = 'HOTEL_NOT_FOUND';
      throw error;
    }
    
    res.status(200).json({
      success: true,
      data: hotel
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get hotel rooms
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getHotelRooms = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if hotel exists
    const hotel = hotels.find(h => h.id === id);
    
    if (!hotel) {
      const error = new Error('Hotel not found');
      error.status = 404;
      error.code = 'HOTEL_NOT_FOUND';
      throw error;
    }
    
    // Get rooms for this hotel
    const hotelRooms = rooms[id] || [];
    
    res.status(200).json({
      success: true,
      count: hotelRooms.length,
      data: hotelRooms
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check room availability
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.checkAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut, guests } = req.body;
    
    // Check if hotel exists
    const hotel = hotels.find(h => h.id === id);
    
    if (!hotel) {
      const error = new Error('Hotel not found');
      error.status = 404;
      error.code = 'HOTEL_NOT_FOUND';
      throw error;
    }
    
    // Mock availability check
    // In production, would check against bookings database
    const hotelRooms = rooms[id] || [];
    
    // Filter rooms by guest capacity
    const availableRooms = hotelRooms.filter(room => room.capacity >= parseInt(guests || 1));
    
    // Mock some rooms as unavailable randomly
    const finalAvailableRooms = availableRooms.filter(() => Math.random() > 0.3);
    
    res.status(200).json({
      success: true,
      available: finalAvailableRooms.length > 0,
      count: finalAvailableRooms.length,
      data: finalAvailableRooms
    });
  } catch (error) {
    next(error);
  }
}; 