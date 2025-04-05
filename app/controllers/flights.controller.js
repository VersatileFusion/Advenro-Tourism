/**
 * Flights Controller
 * Handles flight-related requests
 */

// Mock flights data
const flights = [
  {
    id: 'FL-101',
    airline: {
      id: 'AL-001',
      name: 'SkyWings Airlines',
      logo: '/uploads/airlines/skywings.png'
    },
    flightNumber: 'SW1234',
    departureAirport: {
      code: 'JFK',
      name: 'John F. Kennedy International Airport',
      city: 'New York',
      country: 'USA'
    },
    arrivalAirport: {
      code: 'LAX',
      name: 'Los Angeles International Airport',
      city: 'Los Angeles',
      country: 'USA'
    },
    departureTime: '2023-06-15T08:30:00Z',
    arrivalTime: '2023-06-15T11:45:00Z',
    duration: '3h 15m',
    price: {
      economy: 249.99,
      business: 549.99,
      firstClass: 899.99
    },
    availableSeats: {
      economy: 120,
      business: 24,
      firstClass: 8
    },
    stops: 0,
    aircraft: 'Boeing 737-800',
    amenities: ['WiFi', 'Power Outlets', 'In-flight Entertainment'],
    status: 'scheduled'
  },
  {
    id: 'FL-102',
    airline: {
      id: 'AL-002',
      name: 'Global Airways',
      logo: '/uploads/airlines/global-airways.png'
    },
    flightNumber: 'GA456',
    departureAirport: {
      code: 'JFK',
      name: 'John F. Kennedy International Airport',
      city: 'New York',
      country: 'USA'
    },
    arrivalAirport: {
      code: 'LAX',
      name: 'Los Angeles International Airport',
      city: 'Los Angeles',
      country: 'USA'
    },
    departureTime: '2023-06-15T10:15:00Z',
    arrivalTime: '2023-06-15T13:20:00Z',
    duration: '3h 5m',
    price: {
      economy: 279.99,
      business: 629.99,
      firstClass: 999.99
    },
    availableSeats: {
      economy: 150,
      business: 30,
      firstClass: 10
    },
    stops: 0,
    aircraft: 'Airbus A320',
    amenities: ['WiFi', 'Power Outlets', 'Premium Food', 'Extra Legroom'],
    status: 'scheduled'
  },
  {
    id: 'FL-103',
    airline: {
      id: 'AL-003',
      name: 'Atlantic Connect',
      logo: '/uploads/airlines/atlantic-connect.png'
    },
    flightNumber: 'AC789',
    departureAirport: {
      code: 'JFK',
      name: 'John F. Kennedy International Airport',
      city: 'New York',
      country: 'USA'
    },
    arrivalAirport: {
      code: 'LAX',
      name: 'Los Angeles International Airport',
      city: 'Los Angeles',
      country: 'USA'
    },
    departureTime: '2023-06-15T14:20:00Z',
    arrivalTime: '2023-06-15T19:15:00Z',
    duration: '4h 55m',
    price: {
      economy: 199.99,
      business: 499.99,
      firstClass: 799.99
    },
    availableSeats: {
      economy: 180,
      business: 28,
      firstClass: 6
    },
    stops: 1,
    stopDetails: [
      {
        airport: {
          code: 'DEN',
          name: 'Denver International Airport',
          city: 'Denver',
          country: 'USA'
        },
        arrivalTime: '2023-06-15T16:40:00Z',
        departureTime: '2023-06-15T17:30:00Z',
        duration: '50m'
      }
    ],
    aircraft: 'Boeing 787 Dreamliner',
    amenities: ['WiFi', 'Power Outlets', 'In-flight Entertainment'],
    status: 'scheduled'
  }
];

// Mock airports data
const airports = [
  {
    code: 'JFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    country: 'USA',
    terminals: 6,
    coordinates: {
      latitude: 40.6413,
      longitude: -73.7781
    }
  },
  {
    code: 'LAX',
    name: 'Los Angeles International Airport',
    city: 'Los Angeles',
    country: 'USA',
    terminals: 9,
    coordinates: {
      latitude: 33.9416,
      longitude: -118.4085
    }
  },
  {
    code: 'ORD',
    name: 'O\'Hare International Airport',
    city: 'Chicago',
    country: 'USA',
    terminals: 4,
    coordinates: {
      latitude: 41.9742,
      longitude: -87.9073
    }
  },
  {
    code: 'LHR',
    name: 'London Heathrow Airport',
    city: 'London',
    country: 'United Kingdom',
    terminals: 5,
    coordinates: {
      latitude: 51.4700,
      longitude: -0.4543
    }
  },
  {
    code: 'CDG',
    name: 'Charles de Gaulle Airport',
    city: 'Paris',
    country: 'France',
    terminals: 3,
    coordinates: {
      latitude: 49.0097,
      longitude: 2.5479
    }
  }
];

// Mock airlines data
const airlines = [
  {
    id: 'AL-001',
    name: 'SkyWings Airlines',
    code: 'SW',
    logo: '/uploads/airlines/skywings.png',
    rating: 4.2
  },
  {
    id: 'AL-002',
    name: 'Global Airways',
    code: 'GA',
    logo: '/uploads/airlines/global-airways.png',
    rating: 4.5
  },
  {
    id: 'AL-003',
    name: 'Atlantic Connect',
    code: 'AC',
    logo: '/uploads/airlines/atlantic-connect.png',
    rating: 3.9
  }
];

// Mock bookings data
const flightBookings = [
  {
    id: 'FB-001',
    userId: 'user_123',
    flightId: 'FL-101',
    bookingDate: '2023-05-20T14:30:00Z',
    passengers: [
      {
        type: 'adult',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1985-06-12',
        passportNumber: 'ABC123456',
        seatNumber: '12A'
      }
    ],
    class: 'economy',
    price: 249.99,
    taxes: 25.00,
    total: 274.99,
    status: 'confirmed',
    paymentStatus: 'paid'
  }
];

/**
 * Search flights
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.searchFlights = async (req, res, next) => {
  try {
    const {
      from,
      to,
      departureDate,
      returnDate,
      passengers = 1,
      class: flightClass = 'economy'
    } = req.query;

    // Validate required parameters
    if (!from || !to || !departureDate) {
      return res.status(400).json({
        success: false,
        error: 'Please provide departure airport, arrival airport, and departure date'
      });
    }

    // Filter flights based on search criteria
    const filteredFlights = flights.filter(flight => {
      const matchesRoute = flight.departureAirport.code === from && flight.arrivalAirport.code === to;
      
      // Check if departure date matches (in a real app, we'd compare dates properly)
      // Here we're just simulating the filtering
      const matchesDate = true;
      
      // Check if there are enough available seats
      const hasSeats = flight.availableSeats[flightClass] >= parseInt(passengers, 10);
      
      return matchesRoute && matchesDate && hasSeats;
    });

    res.status(200).json({
      success: true,
      count: filteredFlights.length,
      data: filteredFlights
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get flight details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getFlightDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const flight = flights.find(f => f.id === id);
    
    if (!flight) {
      const error = new Error('Flight not found');
      error.status = 404;
      error.code = 'FLIGHT_NOT_FOUND';
      throw error;
    }
    
    res.status(200).json({
      success: true,
      data: flight
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get airports
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getAirports = async (req, res, next) => {
  try {
    const { search } = req.query;
    
    if (search) {
      const searchLower = search.toLowerCase();
      const filteredAirports = airports.filter(airport => 
        airport.code.toLowerCase().includes(searchLower) ||
        airport.name.toLowerCase().includes(searchLower) ||
        airport.city.toLowerCase().includes(searchLower) ||
        airport.country.toLowerCase().includes(searchLower)
      );
      
      return res.status(200).json({
        success: true,
        count: filteredAirports.length,
        data: filteredAirports
      });
    }
    
    res.status(200).json({
      success: true,
      count: airports.length,
      data: airports
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get airlines
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getAirlines = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      count: airlines.length,
      data: airlines
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Book a flight
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.bookFlight = async (req, res, next) => {
  try {
    const { flightId, passengers, flightClass } = req.body;
    
    // Validate required fields
    if (!flightId || !passengers || !flightClass) {
      return res.status(400).json({
        success: false,
        error: 'Please provide flight ID, passenger details, and flight class'
      });
    }
    
    // Find flight
    const flight = flights.find(f => f.id === flightId);
    if (!flight) {
      const error = new Error('Flight not found');
      error.status = 404;
      error.code = 'FLIGHT_NOT_FOUND';
      throw error;
    }
    
    // Check seat availability
    if (flight.availableSeats[flightClass] < passengers.length) {
      return res.status(400).json({
        success: false,
        error: 'Not enough seats available in the selected class'
      });
    }
    
    // Create booking (in a real app, this would be saved to a database)
    const booking = {
      id: `FB-${Date.now()}`,
      userId: req.user.id,
      flightId: flightId,
      bookingDate: new Date().toISOString(),
      passengers,
      class: flightClass,
      price: flight.price[flightClass] * passengers.length,
      taxes: flight.price[flightClass] * passengers.length * 0.1, // Example tax calculation
      status: 'pending',
      paymentStatus: 'pending'
    };
    
    // Calculate total
    booking.total = booking.price + booking.taxes;
    
    // Update available seats (in a real app, this would be done in a transaction)
    flight.availableSeats[flightClass] -= passengers.length;
    
    // Add to bookings
    flightBookings.push(booking);
    
    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user flight bookings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getUserBookings = async (req, res, next) => {
  try {
    // In a real app, this would query the database for bookings belonging to the authenticated user
    const userBookings = flightBookings.filter(booking => booking.userId === req.user.id);
    
    // Enhance bookings with flight details
    const enhancedBookings = userBookings.map(booking => {
      const flight = flights.find(f => f.id === booking.flightId);
      return {
        ...booking,
        flight
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
    const booking = flightBookings.find(b => b.id === id);
    
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
    
    // Add flight details
    const flight = flights.find(f => f.id === booking.flightId);
    const enhancedBooking = {
      ...booking,
      flight
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
 * Cancel flight booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bookingIndex = flightBookings.findIndex(b => b.id === id);
    
    if (bookingIndex === -1) {
      const error = new Error('Booking not found');
      error.status = 404;
      error.code = 'BOOKING_NOT_FOUND';
      throw error;
    }
    
    const booking = flightBookings[bookingIndex];
    
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
    
    // Update booking status
    booking.status = 'cancelled';
    flightBookings[bookingIndex] = booking;
    
    // Refund logic would go here in a real app
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
}; 