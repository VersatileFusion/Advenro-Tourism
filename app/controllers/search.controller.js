/**
 * Search Controller
 * Provides unified search functionality across different entities
 */

// Import other controllers that have search functionality
const restaurantsController = require('./restaurants.controller');
const toursController = require('./tours.controller');

/**
 * Unified search across all entities
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.unifiedSearch = async (req, res, next) => {
  try {
    const { query, location, types = 'all', limit = 5 } = req.query;
    
    if (!query && !location) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a search query or location'
      });
    }
    
    const selectedTypes = types === 'all'
      ? ['hotels', 'restaurants', 'tours', 'flights', 'events']
      : types.split(',');
    
    // Prepare results object
    const results = {
      success: true,
      data: {}
    };
    
    // Execute searches in parallel
    const searchPromises = [];
    
    // Create fake request objects for each controller
    const searchReq = {
      query: {
        query,
        location,
        limit: parseInt(limit, 10)
      }
    };
    
    // Mock response object to capture results
    const createMockRes = (type) => {
      return {
        status: function(statusCode) {
          return {
            json: function(data) {
              if (data.success) {
                results.data[type] = data.data;
              }
            }
          };
        }
      };
    };
    
    // Execute searches based on selected types
    if (selectedTypes.includes('restaurants')) {
      searchPromises.push(
        restaurantsController.searchRestaurants(searchReq, createMockRes('restaurants'), next)
          .catch(error => {
            console.error('Error searching restaurants:', error);
            results.data.restaurants = [];
          })
      );
    }
    
    if (selectedTypes.includes('tours')) {
      searchPromises.push(
        toursController.searchTours(searchReq, createMockRes('tours'), next)
          .catch(error => {
            console.error('Error searching tours:', error);
            results.data.tours = [];
          })
      );
    }
    
    // Mock search results for other entity types
    if (selectedTypes.includes('hotels')) {
      results.data.hotels = mockHotelSearch(query, location, limit);
    }
    
    if (selectedTypes.includes('flights')) {
      results.data.flights = mockFlightSearch(query, location, limit);
    }
    
    if (selectedTypes.includes('events')) {
      results.data.events = mockEventSearch(query, location, limit);
    }
    
    // Wait for all searches to complete
    await Promise.all(searchPromises);
    
    // Add total count across all types
    results.totalCount = Object.values(results.data)
      .reduce((total, items) => total + (items.length || 0), 0);
    
    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

/**
 * Get popular searches and trending destinations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getTrending = async (req, res, next) => {
  try {
    const trendingDestinations = [
      {
        id: 'dest_001',
        name: 'Paris',
        country: 'France',
        image: '/uploads/destinations/paris.jpg',
        type: 'city',
        highlights: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame Cathedral']
      },
      {
        id: 'dest_002',
        name: 'Bali',
        country: 'Indonesia',
        image: '/uploads/destinations/bali.jpg',
        type: 'island',
        highlights: ['Beaches', 'Rice Terraces', 'Temples']
      },
      {
        id: 'dest_003',
        name: 'Tokyo',
        country: 'Japan',
        image: '/uploads/destinations/tokyo.jpg',
        type: 'city',
        highlights: ['Shibuya Crossing', 'Mt. Fuji', 'Tokyo Tower']
      },
      {
        id: 'dest_004',
        name: 'Barcelona',
        country: 'Spain',
        image: '/uploads/destinations/barcelona.jpg',
        type: 'city',
        highlights: ['Sagrada Familia', 'Park Güell', 'La Rambla']
      },
      {
        id: 'dest_005',
        name: 'New York',
        country: 'USA',
        image: '/uploads/destinations/newyork.jpg',
        type: 'city',
        highlights: ['Times Square', 'Central Park', 'Statue of Liberty']
      }
    ];
    
    const popularSearches = [
      'Beach vacations',
      'Europe tours',
      'Family-friendly hotels',
      'Weekend getaways',
      'All-inclusive resorts',
      'Luxury hotels',
      'Flight deals',
      'Adventure travel',
      'Cultural experiences',
      'Foodie destinations'
    ];
    
    res.status(200).json({
      success: true,
      data: {
        trendingDestinations,
        popularSearches
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get search suggestions as user types
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getSearchSuggestions = async (req, res, next) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // Mock suggestions based on the query
    const queryLower = query.toLowerCase();
    
    // Cities
    const cities = [
      'New York', 'Paris', 'London', 'Tokyo', 'Rome', 'Barcelona', 'Sydney',
      'Amsterdam', 'Berlin', 'Hong Kong', 'Singapore', 'Bangkok', 'Dubai',
      'Los Angeles', 'San Francisco', 'Chicago', 'Miami', 'Toronto', 'Vancouver'
    ];
    
    // Hotels
    const hotels = [
      'Grand Hyatt', 'Marriott Resort', 'Hilton Hotel', 'Four Seasons',
      'Ritz-Carlton', 'Sheraton Hotel', 'W Hotel', 'Holiday Inn'
    ];
    
    // Attractions
    const attractions = [
      'Eiffel Tower', 'Louvre Museum', 'Statue of Liberty', 'Colosseum',
      'Great Wall of China', 'Machu Picchu', 'Taj Mahal', 'Pyramids of Giza'
    ];
    
    // Filter all items based on the query
    const cityMatches = cities.filter(city => city.toLowerCase().includes(queryLower))
      .map(city => ({ type: 'city', name: city }));
    
    const hotelMatches = hotels.filter(hotel => hotel.toLowerCase().includes(queryLower))
      .map(hotel => ({ type: 'hotel', name: hotel }));
    
    const attractionMatches = attractions.filter(attr => attr.toLowerCase().includes(queryLower))
      .map(attr => ({ type: 'attraction', name: attr }));
    
    // Combine and limit results
    const suggestions = [...cityMatches, ...hotelMatches, ...attractionMatches].slice(0, 10);
    
    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mock hotel search results
 * @param {string} query - Search query
 * @param {string} location - Location to search in
 * @param {number} limit - Maximum number of results
 * @returns {Array} Mock hotel search results
 */
const mockHotelSearch = (query, location, limit) => {
  const hotels = [
    {
      id: 'hotel_001',
      name: 'Grand Hyatt Hotel',
      location: 'New York, USA',
      rating: 4.7,
      price: 299,
      currency: 'USD',
      image: '/uploads/hotels/grand-hyatt.jpg'
    },
    {
      id: 'hotel_002',
      name: 'Ritz-Carlton',
      location: 'Paris, France',
      rating: 4.9,
      price: 450,
      currency: 'EUR',
      image: '/uploads/hotels/ritz-carlton.jpg'
    },
    {
      id: 'hotel_003',
      name: 'Mandarin Oriental',
      location: 'Tokyo, Japan',
      rating: 4.8,
      price: 380,
      currency: 'USD',
      image: '/uploads/hotels/mandarin-oriental.jpg'
    }
  ];
  
  // Filter based on query and location if provided
  let results = [...hotels];
  
  if (query) {
    const queryLower = query.toLowerCase();
    results = results.filter(hotel => 
      hotel.name.toLowerCase().includes(queryLower) || 
      hotel.location.toLowerCase().includes(queryLower)
    );
  }
  
  if (location) {
    const locationLower = location.toLowerCase();
    results = results.filter(hotel => 
      hotel.location.toLowerCase().includes(locationLower)
    );
  }
  
  return results.slice(0, limit);
};

/**
 * Mock flight search results
 * @param {string} query - Search query
 * @param {string} location - Location to search in
 * @param {number} limit - Maximum number of results
 * @returns {Array} Mock flight search results
 */
const mockFlightSearch = (query, location, limit) => {
  const flights = [
    {
      id: 'flight_001',
      airline: 'Delta Airlines',
      flightNumber: 'DL1234',
      departure: {
        city: 'New York',
        airport: 'JFK',
        time: '10:00 AM'
      },
      arrival: {
        city: 'London',
        airport: 'LHR',
        time: '10:00 PM'
      },
      price: 750,
      currency: 'USD'
    },
    {
      id: 'flight_002',
      airline: 'British Airways',
      flightNumber: 'BA789',
      departure: {
        city: 'London',
        airport: 'LHR',
        time: '09:30 AM'
      },
      arrival: {
        city: 'Paris',
        airport: 'CDG',
        time: '11:45 AM'
      },
      price: 220,
      currency: 'EUR'
    },
    {
      id: 'flight_003',
      airline: 'Japan Airlines',
      flightNumber: 'JL321',
      departure: {
        city: 'Tokyo',
        airport: 'HND',
        time: '01:15 PM'
      },
      arrival: {
        city: 'Singapore',
        airport: 'SIN',
        time: '07:45 PM'
      },
      price: 580,
      currency: 'USD'
    }
  ];
  
  // Filter based on query and location if provided
  let results = [...flights];
  
  if (query) {
    const queryLower = query.toLowerCase();
    results = results.filter(flight => 
      flight.airline.toLowerCase().includes(queryLower) || 
      flight.departure.city.toLowerCase().includes(queryLower) ||
      flight.arrival.city.toLowerCase().includes(queryLower)
    );
  }
  
  if (location) {
    const locationLower = location.toLowerCase();
    results = results.filter(flight => 
      flight.departure.city.toLowerCase().includes(locationLower) ||
      flight.arrival.city.toLowerCase().includes(locationLower)
    );
  }
  
  return results.slice(0, limit);
};

/**
 * Mock event search results
 * @param {string} query - Search query
 * @param {string} location - Location to search in
 * @param {number} limit - Maximum number of results
 * @returns {Array} Mock event search results
 */
const mockEventSearch = (query, location, limit) => {
  const events = [
    {
      id: 'event_001',
      name: 'Summer Music Festival',
      description: 'A three-day music festival featuring top artists from around the world',
      location: 'New York, USA',
      startDate: '2023-07-15',
      endDate: '2023-07-17',
      price: 150,
      currency: 'USD',
      image: '/uploads/events/music-festival.jpg'
    },
    {
      id: 'event_002',
      name: 'International Food Fair',
      description: 'Taste cuisines from around the world at this annual food fair',
      location: 'Paris, France',
      startDate: '2023-08-10',
      endDate: '2023-08-15',
      price: 25,
      currency: 'EUR',
      image: '/uploads/events/food-fair.jpg'
    },
    {
      id: 'event_003',
      name: 'Tech Conference 2023',
      description: 'The biggest tech conference of the year with keynotes from industry leaders',
      location: 'Tokyo, Japan',
      startDate: '2023-09-05',
      endDate: '2023-09-07',
      price: 300,
      currency: 'USD',
      image: '/uploads/events/tech-conference.jpg'
    }
  ];
  
  // Filter based on query and location if provided
  let results = [...events];
  
  if (query) {
    const queryLower = query.toLowerCase();
    results = results.filter(event => 
      event.name.toLowerCase().includes(queryLower) || 
      event.description.toLowerCase().includes(queryLower) ||
      event.location.toLowerCase().includes(queryLower)
    );
  }
  
  if (location) {
    const locationLower = location.toLowerCase();
    results = results.filter(event => 
      event.location.toLowerCase().includes(locationLower)
    );
  }
  
  return results.slice(0, limit);
}; 