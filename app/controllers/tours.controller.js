/**
 * Tours Controller
 * Handles all tour-related requests
 */

// Mock tours data
const tours = [
  {
    id: 'tour_001',
    name: 'Ancient Rome Walking Tour',
    description: 'Explore the ancient ruins of Rome with an expert guide. Visit the Colosseum, Roman Forum, and Palatine Hill, and learn about the fascinating history of the Roman Empire.',
    duration: '3 hours',
    price: 45.99,
    currency: 'USD',
    rating: 4.8,
    reviewCount: 256,
    location: {
      city: 'Rome',
      country: 'Italy',
      coordinates: {
        latitude: 41.8902,
        longitude: 12.4922
      }
    },
    images: [
      '/uploads/tours/rome-walking-tour-1.jpg',
      '/uploads/tours/rome-walking-tour-2.jpg',
      '/uploads/tours/rome-walking-tour-3.jpg'
    ],
    inclusions: [
      'Professional guide',
      'Skip-the-line tickets',
      'Small group (max 12 people)',
      'Headsets to hear the guide clearly'
    ],
    exclusions: [
      'Hotel pickup and drop-off',
      'Food and drinks',
      'Gratuities'
    ],
    highlights: [
      'Skip the long lines at the Colosseum',
      'Explore the Roman Forum and Palatine Hill',
      'Learn about ancient Roman history and architecture',
      'Small group ensures a personalized experience'
    ],
    schedule: {
      days: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
      startTimes: ['09:00', '13:00', '16:00']
    },
    cancellation: {
      freeCancellationPeriod: 24, // in hours
      refundPolicy: 'Full refund if cancelled 24 hours before the tour'
    },
    featured: true,
    category: 'Walking Tour'
  },
  {
    id: 'tour_002',
    name: 'Paris Food and Wine Tour',
    description: 'Indulge in the culinary delights of Paris with this food and wine tour. Sample artisanal cheeses, freshly baked bread, pastries, and fine French wine while exploring the charming neighborhoods of Paris.',
    duration: '4 hours',
    price: 89.99,
    currency: 'USD',
    rating: 4.9,
    reviewCount: 178,
    location: {
      city: 'Paris',
      country: 'France',
      coordinates: {
        latitude: 48.8566,
        longitude: 2.3522
      }
    },
    images: [
      '/uploads/tours/paris-food-wine-1.jpg',
      '/uploads/tours/paris-food-wine-2.jpg',
      '/uploads/tours/paris-food-wine-3.jpg'
    ],
    inclusions: [
      'Professional food guide',
      'Food tastings (cheeses, bread, pastries)',
      'Wine tastings (3 different wines)',
      'Small group (max 8 people)'
    ],
    exclusions: [
      'Hotel pickup and drop-off',
      'Additional food and drinks',
      'Gratuities'
    ],
    highlights: [
      'Visit local bakeries, cheese shops, and wine bars',
      'Sample authentic French cuisine and wines',
      'Learn about French culinary traditions',
      'Explore charming Paris neighborhoods'
    ],
    schedule: {
      days: ['Tuesday', 'Thursday', 'Saturday'],
      startTimes: ['10:30', '15:00']
    },
    cancellation: {
      freeCancellationPeriod: 48, // in hours
      refundPolicy: 'Full refund if cancelled 48 hours before the tour'
    },
    featured: true,
    category: 'Food & Drink'
  },
  {
    id: 'tour_003',
    name: 'Tokyo Highlights Bike Tour',
    description: 'Discover the vibrant city of Tokyo on this guided bicycle tour. Visit iconic landmarks, explore hidden corners of the city, and experience the unique blend of traditional and modern Japan.',
    duration: '5 hours',
    price: 65.99,
    currency: 'USD',
    rating: 4.7,
    reviewCount: 124,
    location: {
      city: 'Tokyo',
      country: 'Japan',
      coordinates: {
        latitude: 35.6762,
        longitude: 139.6503
      }
    },
    images: [
      '/uploads/tours/tokyo-bike-tour-1.jpg',
      '/uploads/tours/tokyo-bike-tour-2.jpg',
      '/uploads/tours/tokyo-bike-tour-3.jpg'
    ],
    inclusions: [
      'Professional guide',
      'Bicycle and helmet rental',
      'Bottled water',
      'Small group (max 10 people)'
    ],
    exclusions: [
      'Hotel pickup and drop-off',
      'Food and additional drinks',
      'Gratuities'
    ],
    highlights: [
      'Cycle through Tokyo\'s diverse neighborhoods',
      'Visit temples, shrines, and modern landmarks',
      'Explore local markets and gardens',
      'Learn about Japanese culture and history'
    ],
    schedule: {
      days: ['Monday', 'Wednesday', 'Friday', 'Sunday'],
      startTimes: ['09:30', '14:00']
    },
    cancellation: {
      freeCancellationPeriod: 24, // in hours
      refundPolicy: 'Full refund if cancelled 24 hours before the tour'
    },
    featured: false,
    category: 'Bike Tour'
  }
];

// Mock tour categories
const tourCategories = [
  { id: 'cat_001', name: 'Walking Tour', count: 45 },
  { id: 'cat_002', name: 'Food & Drink', count: 32 },
  { id: 'cat_003', name: 'Bike Tour', count: 18 },
  { id: 'cat_004', name: 'Adventure', count: 25 },
  { id: 'cat_005', name: 'Cultural', count: 40 },
  { id: 'cat_006', name: 'Historical', count: 37 },
  { id: 'cat_007', name: 'Nature & Wildlife', count: 22 },
  { id: 'cat_008', name: 'Water Activities', count: 28 }
];

// Mock tour bookings
const tourBookings = [
  {
    id: 'tb_001',
    userId: 'user_123',
    tourId: 'tour_001',
    date: '2023-07-15',
    time: '09:00',
    participants: {
      adults: 2,
      children: 1,
      infants: 0
    },
    contactInfo: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890'
    },
    specialRequests: 'Vegetarian food options needed',
    price: {
      basePrice: 45.99,
      quantity: 3,
      discount: 0,
      taxes: 13.80,
      total: 137.97
    },
    status: 'confirmed',
    paymentStatus: 'paid',
    bookingDate: '2023-06-20T10:30:00Z'
  }
];

/**
 * Get all tours
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getTours = async (req, res, next) => {
  try {
    const { category, featured, minPrice, maxPrice, search, limit = 10, page = 1 } = req.query;
    let filteredTours = [...tours];
    
    // Apply filters
    if (category) {
      filteredTours = filteredTours.filter(t => t.category.toLowerCase() === category.toLowerCase());
    }
    
    if (featured === 'true') {
      filteredTours = filteredTours.filter(t => t.featured);
    }
    
    if (minPrice) {
      const min = parseFloat(minPrice);
      filteredTours = filteredTours.filter(t => t.price >= min);
    }
    
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      filteredTours = filteredTours.filter(t => t.price <= max);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTours = filteredTours.filter(t => 
        t.name.toLowerCase().includes(searchLower) || 
        t.description.toLowerCase().includes(searchLower) ||
        t.location.city.toLowerCase().includes(searchLower) ||
        t.location.country.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedResults = filteredTours.slice(startIndex, endIndex);
    
    // Prepare response
    const response = {
      success: true,
      count: filteredTours.length,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(filteredTours.length / limit)
      },
      data: paginatedResults
    };
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get tour details by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getTourDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tour = tours.find(t => t.id === id);
    
    if (!tour) {
      const error = new Error('Tour not found');
      error.status = 404;
      error.code = 'TOUR_NOT_FOUND';
      throw error;
    }
    
    res.status(200).json({
      success: true,
      data: tour
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tour categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getCategories = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      count: tourCategories.length,
      data: tourCategories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search tours
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.searchTours = async (req, res, next) => {
  try {
    const { query, location, limit = 10 } = req.query;
    
    if (!query && !location) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a search query or location'
      });
    }
    
    let results = [...tours];
    
    if (query) {
      const searchLower = query.toLowerCase();
      results = results.filter(t => 
        t.name.toLowerCase().includes(searchLower) || 
        t.description.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower)
      );
    }
    
    if (location) {
      const locationLower = location.toLowerCase();
      results = results.filter(t => 
        t.location.city.toLowerCase().includes(locationLower) || 
        t.location.country.toLowerCase().includes(locationLower)
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
 * Get popular tours
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getPopularTours = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    
    // Sort by rating (descending)
    const sortedTours = [...tours].sort((a, b) => b.rating - a.rating);
    const popularTours = sortedTours.slice(0, limit);
    
    res.status(200).json({
      success: true,
      count: popularTours.length,
      data: popularTours
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Book a tour
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.bookTour = async (req, res, next) => {
  try {
    const { tourId, date, time, participants, contactInfo, specialRequests } = req.body;
    
    // Validate required fields
    if (!tourId || !date || !time || !participants || !contactInfo) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }
    
    // Find tour
    const tour = tours.find(t => t.id === tourId);
    if (!tour) {
      const error = new Error('Tour not found');
      error.status = 404;
      error.code = 'TOUR_NOT_FOUND';
      throw error;
    }
    
    // Check availability (in a real app, this would check against existing bookings)
    // Here we just simulate this check
    const isAvailable = true;
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        error: 'The selected date and time is not available'
      });
    }
    
    // Calculate total participants
    const totalParticipants = (participants.adults || 0) + (participants.children || 0) + (participants.infants || 0);
    
    // Calculate price
    const basePrice = tour.price;
    const total = basePrice * totalParticipants;
    const taxes = total * 0.1; // Example tax calculation (10%)
    
    // Create booking (in a real app, this would be saved to a database)
    const booking = {
      id: `tb_${Date.now()}`,
      userId: req.user.id,
      tourId,
      date,
      time,
      participants,
      contactInfo,
      specialRequests: specialRequests || '',
      price: {
        basePrice,
        quantity: totalParticipants,
        discount: 0,
        taxes,
        total: total + taxes
      },
      status: 'pending',
      paymentStatus: 'pending',
      bookingDate: new Date().toISOString()
    };
    
    // Add to bookings
    tourBookings.push(booking);
    
    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user tour bookings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getUserBookings = async (req, res, next) => {
  try {
    // In a real app, this would query the database for bookings belonging to the authenticated user
    const userBookings = tourBookings.filter(booking => booking.userId === req.user.id);
    
    // Enhance bookings with tour details
    const enhancedBookings = userBookings.map(booking => {
      const tour = tours.find(t => t.id === booking.tourId);
      return {
        ...booking,
        tour: {
          id: tour.id,
          name: tour.name,
          image: tour.images[0],
          location: tour.location
        }
      };
    });
    
    res.status(200).json({
      success: true,
      count: enhancedBookings.length,
      data: enhancedBookings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get booking details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getBookingDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = tourBookings.find(b => b.id === id);
    
    if (!booking) {
      const error = new Error('Booking not found');
      error.status = 404;
      error.code = 'BOOKING_NOT_FOUND';
      throw error;
    }
    
    // Verify booking belongs to user
    if (booking.userId !== req.user.id) {
      const error = new Error('Unauthorized');
      error.status = 403;
      error.code = 'UNAUTHORIZED';
      throw error;
    }
    
    // Add tour details
    const tour = tours.find(t => t.id === booking.tourId);
    const enhancedBooking = {
      ...booking,
      tour
    };
    
    res.status(200).json({
      success: true,
      data: enhancedBooking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel tour booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bookingIndex = tourBookings.findIndex(b => b.id === id);
    
    if (bookingIndex === -1) {
      const error = new Error('Booking not found');
      error.status = 404;
      error.code = 'BOOKING_NOT_FOUND';
      throw error;
    }
    
    const booking = tourBookings[bookingIndex];
    
    // Verify booking belongs to user
    if (booking.userId !== req.user.id) {
      const error = new Error('Unauthorized');
      error.status = 403;
      error.code = 'UNAUTHORIZED';
      throw error;
    }
    
    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Booking already cancelled'
      });
    }
    
    // Check cancellation policy
    const tourItem = tours.find(t => t.id === booking.tourId);
    const bookingDate = new Date(booking.date + 'T' + booking.time);
    const currentDate = new Date();
    const timeDiff = bookingDate.getTime() - currentDate.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    // If within free cancellation period
    if (hoursDiff >= tourItem.cancellation.freeCancellationPeriod) {
      // Full refund
      booking.status = 'cancelled';
      booking.paymentStatus = 'refunded';
    } else {
      // No refund or partial refund based on policy
      booking.status = 'cancelled';
      booking.paymentStatus = 'no_refund';
    }
    
    tourBookings[bookingIndex] = booking;
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
}; 