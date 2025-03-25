const Event = require('../models/Event');
const EventBooking = require('../models/EventBooking');
const ErrorLog = require('../models/ErrorLog');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Get all events with filtering
exports.getAllEvents = async (req, res) => {
  try {
    // Build query based on filters
    const queryObj = { active: true };
    
    // Filter by event type
    if (req.query.type) {
      queryObj.type = { $in: req.query.type.split(',') };
    }
    
    // Filter by dates
    if (req.query.startDate) {
      queryObj.startDate = { $gte: new Date(req.query.startDate) };
    }
    
    if (req.query.endDate) {
      queryObj.endDate = { $lte: new Date(req.query.endDate) };
    }
    
    // Filter by price range
    if (req.query.minPrice || req.query.maxPrice) {
      queryObj.tickets = {};
      
      if (req.query.minPrice) {
        queryObj.minPrice = { $gte: parseFloat(req.query.minPrice) };
      }
      
      if (req.query.maxPrice) {
        queryObj.maxPrice = { $lte: parseFloat(req.query.maxPrice) };
      }
    }
    
    // Free events only
    if (req.query.free === 'true') {
      queryObj.isFree = true;
    }
    
    // Filter by tags
    if (req.query.tags) {
      queryObj.tags = { $in: req.query.tags.split(',') };
    }
    
    // Filter by features
    if (req.query.features) {
      const features = req.query.features.split(',');
      
      features.forEach(feature => {
        if (feature === 'handicapAccessible') {
          queryObj['features.handicapAccessible'] = true;
        } else if (feature === 'familyFriendly') {
          queryObj['features.familyFriendly'] = true;
        } else if (feature === 'foodAvailable') {
          queryObj['features.foodAvailable'] = true;
        } else if (feature === 'alcoholServed') {
          queryObj['features.alcoholServed'] = true;
        } else if (feature === 'parkingAvailable') {
          queryObj['features.parkingAvailable'] = true;
        } else if (feature === 'seatingProvided') {
          queryObj['features.seatingProvided'] = true;
        }
      });
    }
    
    // Filter by status
    if (req.query.status) {
      queryObj.status = req.query.status;
    } else {
      // By default, exclude canceled events
      queryObj.status = { $ne: 'canceled' };
    }
    
    // Location-based search
    if (req.query.near) {
      const [lng, lat] = req.query.near.split(',').map(Number);
      const distance = req.query.distance ? parseInt(req.query.distance) * 1000 : 10000; // Convert to meters, default 10km
      
      if (!isNaN(lng) && !isNaN(lat)) {
        return res.status(200).json({
          status: 'success',
          results: await Event.countDocuments(queryObj),
          data: {
            events: await Event.findEventsNearby(lng, lat, distance, 50)
          }
        });
      }
    }
    
    // Sorting
    let sortBy = { startDate: 1 }; // Default sort by start date (earliest first)
    
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'price-asc':
          sortBy = { minPrice: 1 };
          break;
        case 'price-desc':
          sortBy = { minPrice: -1 };
          break;
        case 'date-asc':
          sortBy = { startDate: 1 };
          break;
        case 'date-desc':
          sortBy = { startDate: -1 };
          break;
        case 'rating':
          sortBy = { averageRating: -1 };
          break;
        case 'popularity':
          sortBy = { currentAttendees: -1 };
          break;
      }
    }
    
    // Time filter for upcoming, ongoing, past events
    const now = new Date();
    
    if (req.query.timeframe === 'upcoming') {
      queryObj.startDate = { $gt: now };
    } else if (req.query.timeframe === 'ongoing') {
      queryObj.startDate = { $lte: now };
      queryObj.endDate = { $gte: now };
    } else if (req.query.timeframe === 'past') {
      queryObj.endDate = { $lt: now };
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Execute query
    const events = await Event.find(queryObj)
      .sort(sortBy)
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Event.countDocuments(queryObj);
    
    res.status(200).json({
      status: 'success',
      results: events.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      data: {
        events
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'getAllEvents',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve events',
      error: error.message
    });
  }
};

// Get a single event by ID
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event || !event.active) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }
    
    // Get booking stats if available
    let bookingStats = null;
    if (req.query.stats === 'true' && req.user && req.user.role === 'admin') {
      bookingStats = await EventBooking.getBookingStats(event._id);
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        event,
        bookingStats
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'getEvent',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve event'
    });
  }
};

// Create a new event (admin only)
exports.createEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    // Process location data
    if (req.body.latitude && req.body.longitude) {
      if (!req.body.location) {
        req.body.location = {};
      }
      
      req.body.location.coordinates = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
      };
      
      // Remove the latitude/longitude as they're now in location
      delete req.body.latitude;
      delete req.body.longitude;
    }
    
    // Handle image uploads if any
    if (req.files) {
      const images = [];
      
      // Process cover image
      if (req.files.coverImage) {
        req.body.coverImage = req.files.coverImage[0].filename;
      }
      
      // Process additional images
      if (req.files.images) {
        req.files.images.forEach(file => {
          images.push(file.filename);
        });
        req.body.images = images;
      }
    }
    
    // Process tags array
    if (typeof req.body.tags === 'string') {
      req.body.tags = req.body.tags.split(',').map(tag => tag.trim());
    }
    
    // Create the event
    const event = await Event.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: {
        event
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'createEvent',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to create event',
      error: error.message
    });
  }
};

// Update an event (admin only)
exports.updateEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    // Find the event
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }
    
    // Process location data
    if (req.body.latitude && req.body.longitude) {
      if (!req.body.location) {
        req.body.location = {};
      }
      
      req.body.location.coordinates = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
      };
      
      // Remove the latitude/longitude as they're now in location
      delete req.body.latitude;
      delete req.body.longitude;
    }
    
    // Handle image uploads if any
    if (req.files) {
      // Process cover image
      if (req.files.coverImage) {
        // Delete old cover image if it exists and isn't the default
        if (event.coverImage && event.coverImage !== 'default-event.jpg') {
          const coverImagePath = path.join(__dirname, '../../public/uploads/events', event.coverImage);
          if (fs.existsSync(coverImagePath)) {
            fs.unlinkSync(coverImagePath);
          }
        }
        
        req.body.coverImage = req.files.coverImage[0].filename;
      }
      
      // Process additional images
      if (req.files.images) {
        const images = [...(event.images || [])];
        
        req.files.images.forEach(file => {
          images.push(file.filename);
        });
        
        req.body.images = images;
      }
    }
    
    // Process tags array
    if (typeof req.body.tags === 'string') {
      req.body.tags = req.body.tags.split(',').map(tag => tag.trim());
    }
    
    // Update the event
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        event: updatedEvent
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'updateEvent',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to update event',
      error: error.message
    });
  }
};

// Delete an event (admin only - soft delete)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: null,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'deleteEvent',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete event'
    });
  }
};

// Get events by type
exports.getEventsByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    const events = await Event.find({
      type,
      active: true,
      status: { $ne: 'canceled' }
    }).sort({ startDate: 1 });
    
    res.status(200).json({
      status: 'success',
      results: events.length,
      data: {
        events
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'getEventsByType',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve events by type'
    });
  }
};

// Get upcoming events
exports.getUpcomingEvents = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const events = await Event.findUpcomingEvents(limit);
    
    res.status(200).json({
      status: 'success',
      results: events.length,
      data: {
        events
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'getUpcomingEvents',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve upcoming events'
    });
  }
};

// Get tickets for an event
exports.getEventTickets = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event || !event.active) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }
    
    // Filter out tickets availability
    const tickets = event.tickets.map(ticket => ({
      _id: ticket._id,
      name: ticket.name,
      description: ticket.description,
      price: ticket.price,
      benefits: ticket.benefits,
      available: event.getAvailableTickets(ticket._id),
      isSoldOut: event.isTicketSoldOut(ticket._id),
      maxPerPurchase: ticket.maxPerPurchase
    }));
    
    res.status(200).json({
      status: 'success',
      data: {
        tickets
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'getEventTickets',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve event tickets'
    });
  }
};

// Add a ticket to an event (admin only)
exports.addEventTicket = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }
    
    // Add the new ticket
    event.tickets.push(req.body);
    await event.save();
    
    const addedTicket = event.tickets[event.tickets.length - 1];
    
    res.status(201).json({
      status: 'success',
      data: {
        ticket: addedTicket
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'addEventTicket',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to add ticket to event'
    });
  }
};

// Update a ticket (admin only)
exports.updateEventTicket = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { id, ticketId } = req.params;
    
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }
    
    // Find the ticket
    const ticketIndex = event.tickets.findIndex(ticket => ticket._id.toString() === ticketId);
    
    if (ticketIndex === -1) {
      return res.status(404).json({
        status: 'fail',
        message: 'Ticket not found'
      });
    }
    
    // Update the ticket
    Object.keys(req.body).forEach(key => {
      event.tickets[ticketIndex][key] = req.body[key];
    });
    
    await event.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        ticket: event.tickets[ticketIndex]
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'updateEventTicket',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to update event ticket'
    });
  }
};

// Remove a ticket (admin only)
exports.removeEventTicket = async (req, res) => {
  try {
    const { id, ticketId } = req.params;
    
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({
        status: 'fail',
        message: 'Event not found'
      });
    }
    
    // Find the ticket
    const ticketIndex = event.tickets.findIndex(ticket => ticket._id.toString() === ticketId);
    
    if (ticketIndex === -1) {
      return res.status(404).json({
        status: 'fail',
        message: 'Ticket not found'
      });
    }
    
    // Check if there are any bookings for this ticket
    const bookingsExist = await EventBooking.exists({
      'tickets.ticket': mongoose.Types.ObjectId(ticketId)
    });
    
    if (bookingsExist) {
      // Don't delete, just mark as inactive
      event.tickets[ticketIndex].active = false;
      await event.save();
      
      return res.status(200).json({
        status: 'success',
        message: 'Ticket marked as inactive due to existing bookings',
        data: null
      });
    }
    
    // If no bookings, remove the ticket
    event.tickets.splice(ticketIndex, 1);
    await event.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Ticket removed successfully',
      data: null
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'removeEventTicket',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove event ticket'
    });
  }
}; 