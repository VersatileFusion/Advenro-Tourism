/**
 * Restaurants Controller
 * Handles all restaurant-related requests
 */

// Mock restaurants data
const restaurants = [
  {
    id: 'rest_001',
    name: 'Bella Italia',
    description: 'Authentic Italian cuisine in a cozy atmosphere',
    cuisine: 'Italian',
    priceRange: '$$',
    rating: 4.7,
    address: {
      street: '123 Pasta Street',
      city: 'Rome',
      state: 'Lazio',
      zipCode: '00184',
      country: 'Italy',
      coordinates: {
        latitude: 41.8902,
        longitude: 12.4922
      }
    },
    contact: {
      phone: '+39 06 1234 5678',
      email: 'info@bellaitalia.com',
      website: 'https://bellaitalia.example.com'
    },
    hours: {
      monday: '11:00 - 22:00',
      tuesday: '11:00 - 22:00',
      wednesday: '11:00 - 22:00',
      thursday: '11:00 - 22:00',
      friday: '11:00 - 23:00',
      saturday: '10:00 - 23:00',
      sunday: '10:00 - 22:00'
    },
    images: [
      '/uploads/restaurants/bella-italia-1.jpg',
      '/uploads/restaurants/bella-italia-2.jpg',
      '/uploads/restaurants/bella-italia-3.jpg'
    ],
    menuCategories: [
      {
        name: 'Appetizers',
        items: [
          {
            id: 'item_001',
            name: 'Bruschetta',
            description: 'Toasted bread with fresh tomatoes, garlic, and basil',
            price: 8.99,
            image: '/uploads/restaurants/bruschetta.jpg'
          },
          {
            id: 'item_002',
            name: 'Caprese Salad',
            description: 'Fresh mozzarella, tomatoes, and basil with balsamic glaze',
            price: 10.99,
            image: '/uploads/restaurants/caprese.jpg'
          }
        ]
      },
      {
        name: 'Pasta',
        items: [
          {
            id: 'item_003',
            name: 'Spaghetti Carbonara',
            description: 'Spaghetti with egg, pecorino cheese, pancetta, and black pepper',
            price: 14.99,
            image: '/uploads/restaurants/carbonara.jpg'
          },
          {
            id: 'item_004',
            name: 'Fettuccine Alfredo',
            description: 'Fettuccine with creamy parmesan sauce',
            price: 13.99,
            image: '/uploads/restaurants/alfredo.jpg'
          }
        ]
      }
    ],
    features: ['Outdoor Seating', 'Takeout', 'Delivery', 'Vegetarian Options', 'Vegan Options'],
    reviews: [
      {
        id: 'rev_001',
        user: {
          id: 'user_123',
          name: 'John Doe',
          avatar: '/uploads/avatars/john.jpg'
        },
        rating: 5,
        title: 'Amazing authentic Italian food',
        comment: 'The pasta was incredible and the service was excellent. Highly recommended!',
        date: '2023-03-15T14:30:00Z'
      }
    ]
  },
  {
    id: 'rest_002',
    name: 'Sushi Dynasty',
    description: 'Premium Japanese cuisine with fresh seafood daily',
    cuisine: 'Japanese',
    priceRange: '$$$',
    rating: 4.8,
    address: {
      street: '456 Ocean Drive',
      city: 'Tokyo',
      state: 'Tokyo',
      zipCode: '100-0001',
      country: 'Japan',
      coordinates: {
        latitude: 35.6895,
        longitude: 139.6917
      }
    },
    contact: {
      phone: '+81 3 1234 5678',
      email: 'info@sushidynasty.com',
      website: 'https://sushidynasty.example.com'
    },
    hours: {
      monday: '12:00 - 22:00',
      tuesday: '12:00 - 22:00',
      wednesday: '12:00 - 22:00',
      thursday: '12:00 - 22:00',
      friday: '12:00 - 23:00',
      saturday: '12:00 - 23:00',
      sunday: '12:00 - 21:00'
    },
    images: [
      '/uploads/restaurants/sushi-dynasty-1.jpg',
      '/uploads/restaurants/sushi-dynasty-2.jpg',
      '/uploads/restaurants/sushi-dynasty-3.jpg'
    ],
    menuCategories: [
      {
        name: 'Sashimi',
        items: [
          {
            id: 'item_005',
            name: 'Salmon Sashimi',
            description: 'Fresh slices of premium salmon',
            price: 15.99,
            image: '/uploads/restaurants/salmon-sashimi.jpg'
          },
          {
            id: 'item_006',
            name: 'Tuna Sashimi',
            description: 'Premium cuts of bluefin tuna',
            price: 18.99,
            image: '/uploads/restaurants/tuna-sashimi.jpg'
          }
        ]
      },
      {
        name: 'Rolls',
        items: [
          {
            id: 'item_007',
            name: 'California Roll',
            description: 'Crab, avocado, and cucumber wrapped in seaweed and rice',
            price: 12.99,
            image: '/uploads/restaurants/california-roll.jpg'
          },
          {
            id: 'item_008',
            name: 'Dragon Roll',
            description: 'Eel, cucumber, topped with avocado and eel sauce',
            price: 16.99,
            image: '/uploads/restaurants/dragon-roll.jpg'
          }
        ]
      }
    ],
    features: ['Delivery', 'Takeout', 'Gluten-Free Options', 'Private Dining'],
    reviews: [
      {
        id: 'rev_002',
        user: {
          id: 'user_456',
          name: 'Jane Smith',
          avatar: '/uploads/avatars/jane.jpg'
        },
        rating: 5,
        title: 'Best sushi in town',
        comment: 'The freshest fish I\'ve ever had. Amazing presentation and flavors!',
        date: '2023-04-20T18:45:00Z'
      }
    ]
  }
];

// Mock restaurant categories
const restaurantCategories = [
  { id: 'cat_001', name: 'Italian', icon: 'pasta', count: 24 },
  { id: 'cat_002', name: 'Japanese', icon: 'sushi', count: 18 },
  { id: 'cat_003', name: 'Mexican', icon: 'taco', count: 15 },
  { id: 'cat_004', name: 'Chinese', icon: 'dumpling', count: 22 },
  { id: 'cat_005', name: 'Indian', icon: 'curry', count: 12 },
  { id: 'cat_006', name: 'Thai', icon: 'noodles', count: 9 },
  { id: 'cat_007', name: 'American', icon: 'burger', count: 30 },
  { id: 'cat_008', name: 'Mediterranean', icon: 'hummus', count: 14 }
];

/**
 * Get all restaurants
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getRestaurants = async (req, res, next) => {
  try {
    const { cuisine, priceRange, rating, search, limit = 10, page = 1 } = req.query;
    let filteredRestaurants = [...restaurants];
    
    // Apply filters
    if (cuisine) {
      filteredRestaurants = filteredRestaurants.filter(r => r.cuisine.toLowerCase() === cuisine.toLowerCase());
    }
    
    if (priceRange) {
      filteredRestaurants = filteredRestaurants.filter(r => r.priceRange === priceRange);
    }
    
    if (rating) {
      const minRating = parseFloat(rating);
      filteredRestaurants = filteredRestaurants.filter(r => r.rating >= minRating);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredRestaurants = filteredRestaurants.filter(r => 
        r.name.toLowerCase().includes(searchLower) || 
        r.description.toLowerCase().includes(searchLower) ||
        r.cuisine.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedResults = filteredRestaurants.slice(startIndex, endIndex);
    
    // Prepare response
    const response = {
      success: true,
      count: filteredRestaurants.length,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(filteredRestaurants.length / limit)
      },
      data: paginatedResults
    };
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get restaurant details by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getRestaurantDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const restaurant = restaurants.find(r => r.id === id);
    
    if (!restaurant) {
      const error = new Error('Restaurant not found');
      error.status = 404;
      error.code = 'RESTAURANT_NOT_FOUND';
      throw error;
    }
    
    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get restaurant categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getCategories = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      count: restaurantCategories.length,
      data: restaurantCategories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search restaurants
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.searchRestaurants = async (req, res, next) => {
  try {
    const { query, location, limit = 10 } = req.query;
    
    if (!query && !location) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a search query or location'
      });
    }
    
    let results = [...restaurants];
    
    if (query) {
      const searchLower = query.toLowerCase();
      results = results.filter(r => 
        r.name.toLowerCase().includes(searchLower) || 
        r.description.toLowerCase().includes(searchLower) ||
        r.cuisine.toLowerCase().includes(searchLower)
      );
    }
    
    if (location) {
      const locationLower = location.toLowerCase();
      results = results.filter(r => 
        r.address.city.toLowerCase().includes(locationLower) || 
        r.address.country.toLowerCase().includes(locationLower)
      );
    }
    
    // Limit results
    results = results.slice(0, limit);
    
    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get popular restaurants
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getPopularRestaurants = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    
    // Sort by rating (descending)
    const sortedRestaurants = [...restaurants].sort((a, b) => b.rating - a.rating);
    const popularRestaurants = sortedRestaurants.slice(0, limit);
    
    res.status(200).json({
      success: true,
      count: popularRestaurants.length,
      data: popularRestaurants
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get nearby restaurants
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getNearbyRestaurants = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 10, limit = 10 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Please provide latitude and longitude coordinates'
      });
    }
    
    // In a real app, we would perform a geo-spatial query
    // For mock data, we'll just return a subset of restaurants
    const nearbyRestaurants = restaurants.slice(0, limit);
    
    res.status(200).json({
      success: true,
      count: nearbyRestaurants.length,
      data: nearbyRestaurants
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get restaurant reviews
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getRestaurantReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const restaurant = restaurants.find(r => r.id === id);
    
    if (!restaurant) {
      const error = new Error('Restaurant not found');
      error.status = 404;
      error.code = 'RESTAURANT_NOT_FOUND';
      throw error;
    }
    
    res.status(200).json({
      success: true,
      count: restaurant.reviews.length,
      data: restaurant.reviews
    });
  } catch (error) {
    next(error);
  }
}; 