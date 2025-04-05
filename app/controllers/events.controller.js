/**
 * Events Controller
 * Handles events-related operations
 */

// Mock events data
const events = [
  {
    id: 'evt-001',
    name: 'New York Fashion Week',
    description: 'The biggest fashion event in NYC showcasing the latest designs from top designers around the world.',
    location: 'New York, USA',
    venue: 'Lincoln Center',
    address: '10 Lincoln Center Plaza, New York, NY 10023',
    startDate: '2023-09-08T10:00:00Z',
    endDate: '2023-09-15T20:00:00Z',
    category: 'Fashion',
    image: '/images/events/fashion-week.jpg',
    tickets: [
      { type: 'General Admission', price: 150, currency: 'USD', available: 500 },
      { type: 'VIP', price: 350, currency: 'USD', available: 100 },
      { type: 'Premium', price: 550, currency: 'USD', available: 50 }
    ],
    organizer: 'Fashion Council of America',
    featured: true,
    popularity: 92
  },
  {
    id: 'evt-002',
    name: 'Tokyo Anime Festival',
    description: 'Annual anime and manga celebration featuring new releases, artist exhibitions, and cosplay competitions.',
    location: 'Tokyo, Japan',
    venue: 'Tokyo Big Sight',
    address: '3-11-1 Ariake, Koto City, Tokyo, 135-0063',
    startDate: '2023-08-15T09:00:00Z',
    endDate: '2023-08-18T18:00:00Z',
    category: 'Entertainment',
    image: '/images/events/anime-festival.jpg',
    tickets: [
      { type: 'Day Pass', price: 40, currency: 'USD', available: 2000 },
      { type: 'Full Event', price: 120, currency: 'USD', available: 1500 },
      { type: 'Premium Pass', price: 200, currency: 'USD', available: 300 }
    ],
    organizer: 'Tokyo Anime Association',
    featured: true,
    popularity: 88
  },
  {
    id: 'evt-003',
    name: 'Paris Jazz Festival',
    description: 'A celebration of jazz music featuring renowned artists from around the globe in the heart of Paris.',
    location: 'Paris, France',
    venue: 'Parc Floral de Paris',
    address: 'Route de la Pyramide, 75012 Paris, France',
    startDate: '2023-07-01T16:00:00Z',
    endDate: '2023-07-31T23:00:00Z',
    category: 'Music',
    image: '/images/events/jazz-festival.jpg',
    tickets: [
      { type: 'Single Day', price: 30, currency: 'EUR', available: 1000 },
      { type: 'Weekend Pass', price: 55, currency: 'EUR', available: 500 },
      { type: 'Full Month Pass', price: 180, currency: 'EUR', available: 200 }
    ],
    organizer: 'Paris Cultural Department',
    featured: false,
    popularity: 85
  },
  {
    id: 'evt-004',
    name: 'Barcelona Tech Conference',
    description: 'Leading technology conference featuring keynotes from industry leaders, workshops, and networking opportunities.',
    location: 'Barcelona, Spain',
    venue: 'Fira Barcelona Gran Via',
    address: 'Av. Joan Carles I, 64, 08908 L\'Hospitalet de Llobregat, Barcelona, Spain',
    startDate: '2023-10-10T08:00:00Z',
    endDate: '2023-10-12T18:00:00Z',
    category: 'Technology',
    image: '/images/events/tech-conference.jpg',
    tickets: [
      { type: 'Standard', price: 250, currency: 'EUR', available: 3000 },
      { type: 'Business', price: 450, currency: 'EUR', available: 1000 },
      { type: 'Executive', price: 850, currency: 'EUR', available: 200 }
    ],
    organizer: 'Tech Innovations Group',
    featured: true,
    popularity: 90
  },
  {
    id: 'evt-005',
    name: 'Melbourne Food & Wine Festival',
    description: 'Australia\'s premier food and wine event featuring tastings, chef demonstrations, and culinary workshops.',
    location: 'Melbourne, Australia',
    venue: 'Various Locations',
    address: 'Melbourne, Victoria, Australia',
    startDate: '2023-11-18T10:00:00Z',
    endDate: '2023-11-29T22:00:00Z',
    category: 'Food & Drink',
    image: '/images/events/food-festival.jpg',
    tickets: [
      { type: 'Tasting Pass', price: 65, currency: 'AUD', available: 2000 },
      { type: 'Gourmet Experience', price: 120, currency: 'AUD', available: 800 },
      { type: 'Chef\'s Table VIP', price: 220, currency: 'AUD', available: 100 }
    ],
    organizer: 'Melbourne Food & Wine Council',
    featured: false,
    popularity: 86
  }
];

// Mock event categories
const eventCategories = [
  { id: 'cat-001', name: 'Music', count: 28 },
  { id: 'cat-002', name: 'Sports', count: 15 },
  { id: 'cat-003', name: 'Food & Drink', count: 22 },
  { id: 'cat-004', name: 'Technology', count: 18 },
  { id: 'cat-005', name: 'Fashion', count: 12 },
  { id: 'cat-006', name: 'Entertainment', count: 30 },
  { id: 'cat-007', name: 'Business', count: 25 },
  { id: 'cat-008', name: 'Health & Wellness', count: 20 }
];

// Mock event bookings
const eventBookings = [
  {
    id: 'evtbk-001',
    userId: 'user123',
    eventId: 'evt-001',
    ticketType: 'General Admission',
    quantity: 2,
    totalPrice: 300,
    currency: 'USD',
    bookingDate: '2023-07-15T14:30:00Z',
    status: 'confirmed',
    attendees: [
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Doe', email: 'jane@example.com' }
    ],
    paymentStatus: 'paid',
    ticketDeliveryMethod: 'email'
  }
];

/**
 * Get all events with filtering and pagination
 * @param {Object} options - Filter and pagination options
 * @returns {Object} Events data with pagination info
 */
const getEvents = (options = {}) => {
  let { 
    category, 
    featured, 
    upcoming = true, 
    page = 1, 
    limit = 10,
    search = '',
    location = '',
    startDate,
    endDate,
    sort = 'popularity' 
  } = options;

  page = parseInt(page);
  limit = parseInt(limit);

  // Filter events
  let filteredEvents = [...events];

  if (search) {
    const searchLower = search.toLowerCase();
    filteredEvents = filteredEvents.filter(
      event => event.name.toLowerCase().includes(searchLower) || 
              event.description.toLowerCase().includes(searchLower) ||
              event.location.toLowerCase().includes(searchLower)
    );
  }

  if (category) {
    filteredEvents = filteredEvents.filter(event => event.category === category);
  }

  if (location) {
    const locationLower = location.toLowerCase();
    filteredEvents = filteredEvents.filter(
      event => event.location.toLowerCase().includes(locationLower)
    );
  }

  if (featured !== undefined) {
    filteredEvents = filteredEvents.filter(event => event.featured === featured);
  }

  // Filter by date
  const now = new Date();
  
  if (upcoming) {
    filteredEvents = filteredEvents.filter(
      event => new Date(event.startDate) > now
    );
  }

  if (startDate) {
    const start = new Date(startDate);
    filteredEvents = filteredEvents.filter(
      event => new Date(event.startDate) >= start
    );
  }

  if (endDate) {
    const end = new Date(endDate);
    filteredEvents = filteredEvents.filter(
      event => new Date(event.endDate) <= end
    );
  }

  // Sort events
  switch (sort) {
    case 'date':
      filteredEvents.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      break;
    case 'price_low':
      filteredEvents.sort((a, b) => {
        const minPriceA = Math.min(...a.tickets.map(ticket => ticket.price));
        const minPriceB = Math.min(...b.tickets.map(ticket => ticket.price));
        return minPriceA - minPriceB;
      });
      break;
    case 'price_high':
      filteredEvents.sort((a, b) => {
        const minPriceA = Math.min(...a.tickets.map(ticket => ticket.price));
        const minPriceB = Math.min(...b.tickets.map(ticket => ticket.price));
        return minPriceB - minPriceA;
      });
      break;
    case 'popularity':
    default:
      filteredEvents.sort((a, b) => b.popularity - a.popularity);
  }

  // Paginate results
  const totalEvents = filteredEvents.length;
  const totalPages = Math.ceil(totalEvents / limit);
  const startIndex = (page - 1) * limit;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + limit);

  return {
    success: true,
    data: {
      events: paginatedEvents,
      pagination: {
        total: totalEvents,
        page,
        limit,
        totalPages
      }
    }
  };
};

/**
 * Get an event by ID
 * @param {string} eventId - The event ID
 * @returns {Object} Event data
 */
const getEventById = (eventId) => {
  const event = events.find(event => event.id === eventId);
  
  if (!event) {
    return {
      success: false,
      error: 'Event not found'
    };
  }

  return {
    success: true,
    data: event
  };
};

/**
 * Get featured events
 * @param {number} limit - Maximum number of events to return
 * @returns {Object} Featured events
 */
const getFeaturedEvents = (limit = 4) => {
  const featuredEvents = events
    .filter(event => event.featured)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);

  return {
    success: true,
    data: featuredEvents
  };
};

/**
 * Get upcoming events
 * @param {number} limit - Maximum number of events to return
 * @returns {Object} Upcoming events
 */
const getUpcomingEvents = (limit = 6) => {
  const now = new Date();
  
  const upcomingEvents = events
    .filter(event => new Date(event.startDate) > now)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, limit);

  return {
    success: true,
    data: upcomingEvents
  };
};

/**
 * Get event categories
 * @returns {Object} Event categories
 */
const getEventCategories = () => {
  return {
    success: true,
    data: eventCategories
  };
};

/**
 * Book event tickets
 * @param {Object} bookingData - Booking information
 * @returns {Object} Booking confirmation
 */
const bookEvent = (bookingData) => {
  const { 
    userId, 
    eventId, 
    ticketType, 
    quantity, 
    attendees 
  } = bookingData;

  // Validate required fields
  if (!userId || !eventId || !ticketType || !quantity || !attendees) {
    return {
      success: false,
      error: 'Missing required booking information'
    };
  }

  // Find the event
  const event = events.find(event => event.id === eventId);
  if (!event) {
    return {
      success: false,
      error: 'Event not found'
    };
  }

  // Find the ticket type
  const ticketInfo = event.tickets.find(ticket => ticket.type === ticketType);
  if (!ticketInfo) {
    return {
      success: false,
      error: 'Invalid ticket type'
    };
  }

  // Check availability
  if (ticketInfo.available < quantity) {
    return {
      success: false,
      error: 'Not enough tickets available'
    };
  }

  // Create booking
  const booking = {
    id: `evtbk-${Date.now()}`,
    userId,
    eventId,
    ticketType,
    quantity,
    totalPrice: ticketInfo.price * quantity,
    currency: ticketInfo.currency,
    bookingDate: new Date().toISOString(),
    status: 'confirmed',
    attendees,
    paymentStatus: 'pending',
    ticketDeliveryMethod: 'email'
  };

  // Update ticket availability (in a real app, this would be in a transaction)
  ticketInfo.available -= quantity;

  // Add to bookings array
  eventBookings.push(booking);

  return {
    success: true,
    data: {
      booking,
      event: {
        id: event.id,
        name: event.name,
        location: event.location,
        venue: event.venue,
        startDate: event.startDate,
        endDate: event.endDate
      }
    }
  };
};

/**
 * Get user's event bookings
 * @param {string} userId - User ID
 * @returns {Object} User's bookings
 */
const getUserBookings = (userId) => {
  if (!userId) {
    return {
      success: false,
      error: 'User ID is required'
    };
  }

  // Filter bookings by user ID
  const userBookings = eventBookings.filter(booking => booking.userId === userId);

  // Enhance bookings with event info
  const enhancedBookings = userBookings.map(booking => {
    const event = events.find(event => event.id === booking.eventId);
    return {
      ...booking,
      event: event ? {
        name: event.name,
        location: event.location,
        venue: event.venue,
        startDate: event.startDate,
        endDate: event.endDate,
        image: event.image
      } : null
    };
  });

  return {
    success: true,
    data: enhancedBookings
  };
};

/**
 * Cancel event booking
 * @param {string} bookingId - Booking ID
 * @param {string} userId - User ID
 * @returns {Object} Cancellation status
 */
const cancelBooking = (bookingId, userId) => {
  // Find booking index
  const bookingIndex = eventBookings.findIndex(
    booking => booking.id === bookingId && booking.userId === userId
  );

  if (bookingIndex === -1) {
    return {
      success: false,
      error: 'Booking not found or not authorized'
    };
  }

  const booking = eventBookings[bookingIndex];

  // Check if booking can be cancelled (e.g., not too close to event date)
  const event = events.find(event => event.id === booking.eventId);
  if (event) {
    const eventStartDate = new Date(event.startDate);
    const now = new Date();
    const daysDifference = Math.ceil((eventStartDate - now) / (1000 * 60 * 60 * 24));

    if (daysDifference < 2) {
      return {
        success: false,
        error: 'Bookings cannot be cancelled less than 48 hours before the event'
      };
    }
  }

  // Update booking status
  booking.status = 'cancelled';
  eventBookings[bookingIndex] = booking;

  // Return tickets to available pool (in a real app, this would be in a transaction)
  const ticket = event.tickets.find(t => t.type === booking.ticketType);
  if (ticket) {
    ticket.available += booking.quantity;
  }

  return {
    success: true,
    data: {
      message: 'Booking cancelled successfully',
      bookingId
    }
  };
};

module.exports = {
  getEvents,
  getEventById,
  getFeaturedEvents,
  getUpcomingEvents,
  getEventCategories,
  bookEvent,
  getUserBookings,
  cancelBooking
}; 