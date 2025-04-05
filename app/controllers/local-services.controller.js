/**
 * Local Services Controller
 * Handles local services-related requests
 */

// Mock categories
const categories = [
  {
    id: 'cat_1',
    name: 'Restaurants',
    description: 'Local dining options',
    icon: 'restaurant'
  },
  {
    id: 'cat_2',
    name: 'Tours & Activities',
    description: 'Guided tours and local activities',
    icon: 'tour'
  },
  {
    id: 'cat_3',
    name: 'Transportation',
    description: 'Local transportation options',
    icon: 'car'
  },
  {
    id: 'cat_4',
    name: 'Wellness & Spa',
    description: 'Relaxation and wellness services',
    icon: 'spa'
  },
  {
    id: 'cat_5',
    name: 'Shopping',
    description: 'Local shopping experiences',
    icon: 'shopping'
  }
];

// Mock local services data
const localServices = [
  {
    id: 'service_1',
    name: 'Ocean View Restaurant',
    description: 'Fine dining with a view of the ocean.',
    category: 'cat_1',
    address: '123 Beach Road, Miami, FL 33139',
    location: {
      latitude: 25.7618,
      longitude: -80.1918
    },
    rating: 4.8,
    priceRange: '$$',
    images: [
      'https://example.com/restaurants/ocean-view-1.jpg',
      'https://example.com/restaurants/ocean-view-2.jpg'
    ],
    hours: {
      monday: '11:00 AM - 10:00 PM',
      tuesday: '11:00 AM - 10:00 PM',
      wednesday: '11:00 AM - 10:00 PM',
      thursday: '11:00 AM - 10:00 PM',
      friday: '11:00 AM - 11:00 PM',
      saturday: '11:00 AM - 11:00 PM',
      sunday: '12:00 PM - 9:00 PM'
    },
    contact: {
      phone: '+1234567890',
      email: 'info@oceanviewrestaurant.com',
      website: 'https://oceanviewrestaurant.com'
    },
    features: ['Outdoor Seating', 'Bar', 'Vegan Options', 'Reservation Required']
  },
  {
    id: 'service_2',
    name: 'City Tours',
    description: 'Guided tours around the city with expert local guides.',
    category: 'cat_2',
    address: '456 Downtown Ave, New York, NY 10001',
    location: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    rating: 4.6,
    priceRange: '$$$',
    images: [
      'https://example.com/tours/city-tours-1.jpg',
      'https://example.com/tours/city-tours-2.jpg'
    ],
    hours: {
      monday: '9:00 AM - 5:00 PM',
      tuesday: '9:00 AM - 5:00 PM',
      wednesday: '9:00 AM - 5:00 PM',
      thursday: '9:00 AM - 5:00 PM',
      friday: '9:00 AM - 5:00 PM',
      saturday: '10:00 AM - 6:00 PM',
      sunday: '10:00 AM - 4:00 PM'
    },
    contact: {
      phone: '+1987654321',
      email: 'info@citytours.com',
      website: 'https://citytours.com'
    },
    features: ['Group Tours', 'Private Tours', 'Walking Tours', 'Bus Tours']
  },
  {
    id: 'service_3',
    name: 'Luxury Spa Retreat',
    description: 'Premium spa and wellness services for ultimate relaxation.',
    category: 'cat_4',
    address: '789 Tranquil St, San Francisco, CA 94103',
    location: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    rating: 4.9,
    priceRange: '$$$$',
    images: [
      'https://example.com/spa/luxury-spa-1.jpg',
      'https://example.com/spa/luxury-spa-2.jpg'
    ],
    hours: {
      monday: '10:00 AM - 8:00 PM',
      tuesday: '10:00 AM - 8:00 PM',
      wednesday: '10:00 AM - 8:00 PM',
      thursday: '10:00 AM - 8:00 PM',
      friday: '10:00 AM - 9:00 PM',
      saturday: '9:00 AM - 9:00 PM',
      sunday: '9:00 AM - 7:00 PM'
    },
    contact: {
      phone: '+1654987321',
      email: 'info@luxuryspa.com',
      website: 'https://luxuryspa.com'
    },
    features: ['Massage', 'Facials', 'Body Treatments', 'Couple Packages']
  }
];

/**
 * Get all local services
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getLocalServices = async (req, res, next) => {
  try {
    // Apply category filter if provided
    let filteredServices = [...localServices];
    
    if (req.query.category) {
      filteredServices = filteredServices.filter(service => 
        service.category === req.query.category
      );
    }
    
    // Apply price range filter if provided
    if (req.query.priceRange) {
      filteredServices = filteredServices.filter(service => 
        service.priceRange === req.query.priceRange
      );
    }
    
    res.status(200).json({
      success: true,
      count: filteredServices.length,
      data: filteredServices
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get service categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getCategories = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search local services
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.searchLocalServices = async (req, res, next) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(200).json({
        success: true,
        count: localServices.length,
        data: localServices
      });
    }
    
    // Search implementation (basic text search)
    const searchTerm = query.toLowerCase();
    const searchResults = localServices.filter(service => 
      service.name.toLowerCase().includes(searchTerm) || 
      service.description.toLowerCase().includes(searchTerm)
    );
    
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
 * Get nearby services
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getNearbyServices = async (req, res, next) => {
  try {
    const { latitude, longitude, radius } = req.query;
    
    // In a real implementation, would use geospatial calculations
    // Mock implementation returns all services with a mock distance
    const nearbyServices = localServices.map(service => ({
      ...service,
      distance: Math.random() * 5 // Random distance in km
    })).sort((a, b) => a.distance - b.distance);
    
    res.status(200).json({
      success: true,
      count: nearbyServices.length,
      data: nearbyServices
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get service details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getServiceDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const service = localServices.find(s => s.id === id);
    
    if (!service) {
      const error = new Error('Service not found');
      error.status = 404;
      error.code = 'SERVICE_NOT_FOUND';
      throw error;
    }
    
    // Add category details to service
    const category = categories.find(c => c.id === service.category);
    const serviceWithCategory = {
      ...service,
      categoryDetails: category || null
    };
    
    res.status(200).json({
      success: true,
      data: serviceWithCategory
    });
  } catch (error) {
    next(error);
  }
}; 