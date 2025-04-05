/**
 * Bookings Controller
 * Handles booking-related requests
 */

// Mock bookings data
const bookings = [
  {
    id: 'booking_1',
    userId: 'user_123',
    hotelId: 'hotel_1',
    roomType: 'Deluxe',
    checkIn: '2024-04-10',
    checkOut: '2024-04-15',
    guests: 2,
    totalPrice: 599.99,
    status: 'confirmed',
    paymentStatus: 'paid',
    createdAt: '2024-03-01T12:30:45Z'
  },
  {
    id: 'booking_2',
    userId: 'user_123',
    hotelId: 'hotel_2',
    roomType: 'Standard',
    checkIn: '2024-05-20',
    checkOut: '2024-05-25',
    guests: 1,
    totalPrice: 350.50,
    status: 'pending',
    paymentStatus: 'awaiting',
    createdAt: '2024-03-15T09:22:18Z'
  }
];

// Access to the WebSocketHandler
let webSocketHandler;

// Set WebSocketHandler instance
exports.setWebSocketHandler = (handler) => {
  webSocketHandler = handler;
};

/**
 * Get all bookings for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getBookings = async (req, res, next) => {
  try {
    // In production, fetch from database filtering by user ID
    const userBookings = bookings.filter(booking => booking.userId === req.user.id);
    
    res.status(200).json({
      success: true,
      count: userBookings.length,
      data: userBookings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get booking details by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.getBookingDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // In production, fetch from database
    const booking = bookings.find(b => b.id === id && b.userId === req.user.id);
    
    if (!booking) {
      const error = new Error('Booking not found');
      error.status = 404;
      error.code = 'BOOKING_NOT_FOUND';
      throw error;
    }
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.createBooking = async (req, res, next) => {
  try {
    const {
      hotelId,
      roomType,
      checkIn,
      checkOut,
      guests,
      totalPrice
    } = req.body;
    
    // In production, validate and save to database
    const newBooking = {
      id: `booking_${Date.now()}`,
      userId: req.user.id,
      hotelId,
      roomType,
      checkIn,
      checkOut,
      guests,
      totalPrice,
      status: 'pending',
      paymentStatus: 'awaiting',
      createdAt: new Date().toISOString()
    };
    
    // Mock saving to database
    bookings.push(newBooking);
    
    // Notify via WebSocket
    if (webSocketHandler) {
      webSocketHandler.notifyBookingEvent('created', newBooking);
    }
    
    res.status(201).json({
      success: true,
      data: newBooking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update booking details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // In production, find and update in database
    const bookingIndex = bookings.findIndex(b => b.id === id && b.userId === req.user.id);
    
    if (bookingIndex === -1) {
      const error = new Error('Booking not found');
      error.status = 404;
      error.code = 'BOOKING_NOT_FOUND';
      throw error;
    }
    
    // Check if booking can be updated
    if (['cancelled', 'completed'].includes(bookings[bookingIndex].status)) {
      const error = new Error('Booking cannot be updated');
      error.status = 400;
      error.code = 'BOOKING_CANNOT_BE_UPDATED';
      throw error;
    }
    
    // Update booking
    const updatedBooking = {
      ...bookings[bookingIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    bookings[bookingIndex] = updatedBooking;
    
    // Notify via WebSocket
    if (webSocketHandler) {
      webSocketHandler.notifyBookingEvent('updated', updatedBooking);
    }
    
    res.status(200).json({
      success: true,
      data: updatedBooking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // In production, find and update in database
    const bookingIndex = bookings.findIndex(b => b.id === id && b.userId === req.user.id);
    
    if (bookingIndex === -1) {
      const error = new Error('Booking not found');
      error.status = 404;
      error.code = 'BOOKING_NOT_FOUND';
      throw error;
    }
    
    // Check if booking can be cancelled
    if (['cancelled', 'completed'].includes(bookings[bookingIndex].status)) {
      const error = new Error('Booking cannot be cancelled');
      error.status = 400;
      error.code = 'BOOKING_CANNOT_BE_CANCELLED';
      throw error;
    }
    
    // Cancel booking
    const updatedBooking = {
      ...bookings[bookingIndex],
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    };
    
    bookings[bookingIndex] = updatedBooking;
    
    // Notify via WebSocket
    if (webSocketHandler) {
      webSocketHandler.notifyBookingEvent('cancelled', updatedBooking);
    }
    
    res.status(200).json({
      success: true,
      data: updatedBooking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Modify a booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.modifyBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut, guests, roomType } = req.body;
    
    // In production, find and update in database
    const bookingIndex = bookings.findIndex(b => b.id === id && b.userId === req.user.id);
    
    if (bookingIndex === -1) {
      const error = new Error('Booking not found');
      error.status = 404;
      error.code = 'BOOKING_NOT_FOUND';
      throw error;
    }
    
    // Check if booking can be modified
    if (['cancelled', 'completed'].includes(bookings[bookingIndex].status)) {
      const error = new Error('Booking cannot be modified');
      error.status = 400;
      error.code = 'BOOKING_CANNOT_BE_MODIFIED';
      throw error;
    }
    
    // Calculate any price difference for the modification
    let priceDifference = 0;
    if (roomType && roomType !== bookings[bookingIndex].roomType) {
      // In production, recalculate price based on room type change
      priceDifference = 50; // Mock price difference
    }
    
    // Modify booking
    const modifiedBooking = {
      ...bookings[bookingIndex],
      checkIn: checkIn || bookings[bookingIndex].checkIn,
      checkOut: checkOut || bookings[bookingIndex].checkOut,
      guests: guests || bookings[bookingIndex].guests,
      roomType: roomType || bookings[bookingIndex].roomType,
      totalPrice: bookings[bookingIndex].totalPrice + priceDifference,
      modifiedAt: new Date().toISOString(),
      modifications: [
        ...(bookings[bookingIndex].modifications || []),
        {
          timestamp: new Date().toISOString(),
          priceDifference,
          changes: { checkIn, checkOut, guests, roomType }
        }
      ]
    };
    
    // Save modified booking
    bookings[bookingIndex] = modifiedBooking;
    
    // Notify via WebSocket
    if (webSocketHandler) {
      webSocketHandler.notifyBookingEvent('updated', modifiedBooking);
    }
    
    res.status(200).json({
      success: true,
      data: {
        booking: modifiedBooking,
        priceDifference
      }
    });
  } catch (error) {
    next(error);
  }
}; 