const EventBooking = require('../models/EventBooking');
const Event = require('../models/Event');
const User = require('../models/User');
const ErrorLog = require('../models/ErrorLog');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    // Verify event exists and is active
    const event = await Event.findById(req.body.event);
    if (!event || !event.active || event.status === 'canceled') {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found or unavailable'
      });
    }
    
    // Verify event is not in the past
    if (event.endDate < new Date()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Cannot book tickets for past events'
      });
    }
    
    // Check ticket availability for each requested ticket
    let totalAmount = 0;
    const ticketSelections = [];
    
    if (!req.body.tickets || !Array.isArray(req.body.tickets) || req.body.tickets.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'At least one ticket must be selected'
      });
    }
    
    // Validate each ticket selection
    for (const ticketSelection of req.body.tickets) {
      const eventTicket = event.tickets.id(ticketSelection.ticket);
      
      if (!eventTicket || !eventTicket.active) {
        return res.status(400).json({
          status: 'fail',
          message: `Ticket type not found or not available`
        });
      }
      
      // Check ticket quantity
      const requestedQuantity = ticketSelection.quantity;
      if (requestedQuantity <= 0) {
        return res.status(400).json({
          status: 'fail',
          message: 'Ticket quantity must be greater than 0'
        });
      }
      
      if (requestedQuantity > eventTicket.maxPerPurchase) {
        return res.status(400).json({
          status: 'fail',
          message: `Maximum ${eventTicket.maxPerPurchase} tickets allowed per purchase for ticket type: ${eventTicket.name}`
        });
      }
      
      const availableTickets = event.getAvailableTickets(eventTicket._id);
      if (requestedQuantity > availableTickets) {
        return res.status(400).json({
          status: 'fail',
          message: `Not enough tickets available. Only ${availableTickets} tickets left for ticket type: ${eventTicket.name}`
        });
      }
      
      // Calculate price and add to selections
      const price = eventTicket.price;
      const subtotal = price * requestedQuantity;
      totalAmount += subtotal;
      
      ticketSelections.push({
        ticket: eventTicket._id,
        ticketName: eventTicket.name,
        price,
        quantity: requestedQuantity,
        subtotal
      });
    }
    
    // Validate attendees match ticket quantity
    const totalTickets = ticketSelections.reduce((sum, selection) => sum + selection.quantity, 0);
    if (!req.body.attendees || !Array.isArray(req.body.attendees) || req.body.attendees.length !== totalTickets) {
      return res.status(400).json({
        status: 'fail',
        message: `Attendee details must be provided for each ticket. Expected ${totalTickets} attendees, got ${req.body.attendees ? req.body.attendees.length : 0}`
      });
    }
    
    // Set booking date and user
    const bookingData = {
      event: event._id,
      user: req.user._id,
      bookingDate: new Date(),
      tickets: ticketSelections,
      attendees: req.body.attendees,
      totalAmount,
      paymentStatus: 'pending',
      status: 'pending'
    };
    
    // Create the booking
    const booking = await EventBooking.create(bookingData);
    
    // Update the event's ticket quantities (but don't mark as sold until payment is confirmed)
    for (const selection of ticketSelections) {
      const ticketIndex = event.tickets.findIndex(t => t._id.toString() === selection.ticket.toString());
      if (ticketIndex !== -1) {
        event.tickets[ticketIndex].reservedQuantity = (event.tickets[ticketIndex].reservedQuantity || 0) + selection.quantity;
      }
    }
    await event.save();
    
    res.status(201).json({
      status: 'success',
      data: {
        booking
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'createBooking',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to create booking',
      error: error.message
    });
  }
};

// Get all bookings for an event (admin only)
exports.getAllBookings = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Verify event exists
    const eventExists = await Event.exists({ _id: eventId });
    if (!eventExists) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }
    
    // Set up filters
    const queryObj = { event: eventId };
    
    // Filter by status
    if (req.query.status) {
      queryObj.status = req.query.status;
    }
    
    // Filter by payment status
    if (req.query.paymentStatus) {
      queryObj.paymentStatus = req.query.paymentStatus;
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;
    
    // Execute query with population
    const bookings = await EventBooking.find(queryObj)
      .populate({
        path: 'user',
        select: 'name email'
      })
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total for pagination
    const total = await EventBooking.countDocuments(queryObj);
    
    res.status(200).json({
      status: 'success',
      results: bookings.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      data: {
        bookings
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'getAllBookings',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve bookings'
    });
  }
};

// Get my bookings (current user's bookings)
exports.getMyBookings = async (req, res) => {
  try {
    // Use the authenticated user's ID
    const userId = req.user._id;
    
    // Set up filters
    const queryObj = { user: userId };
    
    // Filter by event
    if (req.query.event) {
      queryObj.event = req.query.event;
    }
    
    // Filter by status
    if (req.query.status) {
      queryObj.status = req.query.status;
    }
    
    // Filter for upcoming events only
    if (req.query.upcoming === 'true') {
      // Join with events to get only upcoming ones
      const bookings = await EventBooking.aggregate([
        { $match: queryObj },
        { $lookup: {
            from: 'events',
            localField: 'event',
            foreignField: '_id',
            as: 'eventData'
          }
        },
        { $match: { 'eventData.endDate': { $gte: new Date() } } },
        { $project: { eventData: 0 } } // Remove the joined event data from results
      ]);
      
      return res.status(200).json({
        status: 'success',
        results: bookings.length,
        data: {
          bookings
        }
      });
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Execute query with population
    const bookings = await EventBooking.find(queryObj)
      .populate({
        path: 'event',
        select: 'name startDate endDate coverImage status location'
      })
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total for pagination
    const total = await EventBooking.countDocuments(queryObj);
    
    res.status(200).json({
      status: 'success',
      results: bookings.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      data: {
        bookings
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'getMyBookings',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve your bookings'
    });
  }
};

// Get a single booking details
exports.getBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await EventBooking.findById(id)
      .populate({
        path: 'event',
        select: 'name startDate endDate coverImage status location organizer'
      })
      .populate({
        path: 'user',
        select: 'name email phone'
      });
    
    if (!booking) {
      return res.status(404).json({
        status: 'fail',
        message: 'Booking not found'
      });
    }
    
    // Check if the user has permission to view this booking
    // Allow admin or the booking owner to view
    if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to view this booking'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        booking
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'getBooking',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve booking details'
    });
  }
};

// Update booking status (admin only)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    
    const booking = await EventBooking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        status: 'fail',
        message: 'Booking not found'
      });
    }
    
    // Update status if provided
    if (status) {
      booking.status = status;
    }
    
    // Update payment status if provided
    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;
      
      // If payment is confirmed, update the sold quantities for the event
      if (paymentStatus === 'paid' && booking.paymentStatus !== 'paid') {
        const event = await Event.findById(booking.event);
        
        if (event) {
          for (const ticketSelection of booking.tickets) {
            const ticketIndex = event.tickets.findIndex(t => t._id.toString() === ticketSelection.ticket.toString());
            
            if (ticketIndex !== -1) {
              // Decrease reserved quantity and increase sold quantity
              event.tickets[ticketIndex].reservedQuantity = (event.tickets[ticketIndex].reservedQuantity || 0) - ticketSelection.quantity;
              event.tickets[ticketIndex].soldQuantity = (event.tickets[ticketIndex].soldQuantity || 0) + ticketSelection.quantity;
            }
          }
          
          await event.save();
        }
      }
    }
    
    await booking.save();
    
    // If booking is confirmed, send confirmation email
    if (status === 'confirmed' && booking.status !== 'confirmed') {
      try {
        const user = await User.findById(booking.user);
        const event = await Event.findById(booking.event);
        
        if (user && event) {
          await sendEmail({
            email: user.email,
            subject: `Your booking for ${event.name} is confirmed!`,
            message: `Dear ${user.name},\n\nYour booking for ${event.name} has been confirmed. Booking reference: ${booking.confirmationCode}.\n\nThank you for your booking!\n\nRegards,\nThe Advenro Team`
          });
        }
      } catch (emailError) {
        // Log email error but don't fail the request
        await ErrorLog.create({
          method: 'updateBookingStatus - sendEmail',
          endpoint: req.originalUrl,
          error: emailError.message,
          stack: emailError.stack
        });
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        booking
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'updateBookingStatus',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to update booking status'
    });
  }
};

// Cancel a booking
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await EventBooking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        status: 'fail',
        message: 'Booking not found'
      });
    }
    
    // Check if the user has permission to cancel this booking
    // Allow admin or the booking owner to cancel
    if (req.user.role !== 'admin' && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to cancel this booking'
      });
    }
    
    // Check if booking is cancellable
    if (!booking.isCancellable) {
      return res.status(400).json({
        status: 'fail',
        message: 'This booking cannot be cancelled. It may be too close to the event date or already cancelled.'
      });
    }
    
    // Update booking status
    booking.status = 'canceled';
    await booking.save();
    
    // Release the reserved tickets back to available inventory
    const event = await Event.findById(booking.event);
    
    if (event) {
      for (const ticketSelection of booking.tickets) {
        const ticketIndex = event.tickets.findIndex(t => t._id.toString() === ticketSelection.ticket.toString());
        
        if (ticketIndex !== -1) {
          // Decrease reserved quantity
          event.tickets[ticketIndex].reservedQuantity = (event.tickets[ticketIndex].reservedQuantity || 0) - ticketSelection.quantity;
          
          // If the tickets were already marked as sold, decrease sold quantity too
          if (booking.paymentStatus === 'paid') {
            event.tickets[ticketIndex].soldQuantity = (event.tickets[ticketIndex].soldQuantity || 0) - ticketSelection.quantity;
          }
        }
      }
      
      await event.save();
    }
    
    // Send cancellation email
    try {
      const user = await User.findById(booking.user);
      
      if (user && event) {
        await sendEmail({
          email: user.email,
          subject: `Your booking for ${event.name} has been cancelled`,
          message: `Dear ${user.name},\n\nYour booking for ${event.name} (ref: ${booking.confirmationCode}) has been cancelled.\n\nIf you paid for this booking, a refund will be processed according to our refund policy.\n\nRegards,\nThe Advenro Team`
        });
      }
    } catch (emailError) {
      // Log email error but don't fail the request
      await ErrorLog.create({
        method: 'cancelBooking - sendEmail',
        endpoint: req.originalUrl,
        error: emailError.message,
        stack: emailError.stack
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Booking cancelled successfully',
      data: null
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'cancelBooking',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel booking'
    });
  }
};

// Update attendee information
exports.updateAttendees = async (req, res) => {
  try {
    const { id } = req.params;
    const { attendees } = req.body;
    
    // Validate input
    if (!attendees || !Array.isArray(attendees)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid attendee data provided'
      });
    }
    
    const booking = await EventBooking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        status: 'fail',
        message: 'Booking not found'
      });
    }
    
    // Check if the user has permission
    if (req.user.role !== 'admin' && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to update this booking'
      });
    }
    
    // Check if booking can be updated
    if (booking.status === 'canceled') {
      return res.status(400).json({
        status: 'fail',
        message: 'Cannot update a cancelled booking'
      });
    }
    
    // Verify the number of attendees matches
    const totalTickets = booking.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
    if (attendees.length !== totalTickets) {
      return res.status(400).json({
        status: 'fail',
        message: `Number of attendees must match the number of tickets (${totalTickets})`
      });
    }
    
    // Update attendees
    booking.attendees = attendees;
    await booking.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        booking
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'updateAttendees',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to update attendee information'
    });
  }
};

// Get booking stats for an event (admin only)
exports.getBookingStats = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Verify event exists
    const eventExists = await Event.exists({ _id: eventId });
    if (!eventExists) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }
    
    const stats = await EventBooking.getBookingStats(eventId);
    
    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'getBookingStats',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve booking statistics'
    });
  }
}; 