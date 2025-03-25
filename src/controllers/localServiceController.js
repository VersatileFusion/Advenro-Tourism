const LocalService = require('../models/LocalService');
const ServiceBooking = require('../models/ServiceBooking');
const ErrorLog = require('../models/ErrorLog');
const { validationResult } = require('express-validator');

// Get all local services with optional filtering
exports.getAllServices = async (req, res) => {
  try {
    const { category, priceMin, priceMax, rating, near, distance } = req.query;
    
    // Build query based on filters
    const query = { active: true };
    
    if (category) {
      query.category = category;
    }
    
    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.base = { $gte: parseFloat(priceMin) };
      if (priceMax) query.price.base = { ...query.price.base, $lte: parseFloat(priceMax) };
    }
    
    if (rating) {
      query['rating.average'] = { $gte: parseFloat(rating) };
    }
    
    // Geospatial query if coordinates are provided
    if (near) {
      const [lng, lat] = near.split(',').map(coord => parseFloat(coord));
      const maxDistance = distance ? parseInt(distance) : 10000; // Default 10km
      
      query['provider.location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: maxDistance
        }
      };
    }
    
    const services = await LocalService.find(query)
      .sort({ 'rating.average': -1 })
      .limit(50);
    
    res.status(200).json({
      status: 'success',
      results: services.length,
      data: {
        services
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'getAllServices',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve services'
    });
  }
};

// Get a specific service by ID
exports.getService = async (req, res) => {
  try {
    const service = await LocalService.findById(req.params.id);
    
    if (!service || !service.active) {
      return res.status(404).json({
        status: 'fail',
        message: 'Service not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        service
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'getService',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve service'
    });
  }
};

// Create a new service (admin only)
exports.createService = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    // Handle image upload if provided
    if (req.file) {
      req.body.image = req.file.filename;
    }
    
    // Process location data
    if (req.body.location) {
      try {
        const location = JSON.parse(req.body.location);
        req.body.provider = {
          ...req.body.provider,
          location
        };
      } catch (e) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid location data format'
        });
      }
    }
    
    const newService = await LocalService.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: {
        service: newService
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'createService',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to create service'
    });
  }
};

// Update a service (admin only)
exports.updateService = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    // Handle image upload if provided
    if (req.file) {
      req.body.image = req.file.filename;
    }
    
    // Process location data
    if (req.body.location) {
      try {
        const location = JSON.parse(req.body.location);
        req.body.provider = {
          ...req.body.provider,
          location
        };
      } catch (e) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid location data format'
        });
      }
    }
    
    const service = await LocalService.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!service) {
      return res.status(404).json({
        status: 'fail',
        message: 'Service not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        service
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'updateService',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to update service'
    });
  }
};

// Delete a service (admin only - soft delete)
exports.deleteService = async (req, res) => {
  try {
    const service = await LocalService.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    
    if (!service) {
      return res.status(404).json({
        status: 'fail',
        message: 'Service not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'deleteService',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete service'
    });
  }
};

// Get services by category
exports.getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const services = await LocalService.find({
      category,
      active: true
    }).sort({ 'rating.average': -1 });
    
    res.status(200).json({
      status: 'success',
      results: services.length,
      data: {
        services
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'getServicesByCategory',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve services by category'
    });
  }
};

// Get services near user location
exports.getNearbyServices = async (req, res) => {
  try {
    const { lng, lat, distance = 10, limit = 10 } = req.query;
    
    if (!lng || !lat) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide longitude and latitude coordinates'
      });
    }
    
    const coordinates = [parseFloat(lng), parseFloat(lat)];
    const radius = parseFloat(distance) * 1000; // Convert to meters
    
    const services = await LocalService.find({
      'provider.location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates
          },
          $maxDistance: radius
        }
      },
      active: true
    }).limit(parseInt(limit));
    
    res.status(200).json({
      status: 'success',
      results: services.length,
      data: {
        services
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'getNearbyServices',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve nearby services'
    });
  }
};

// Book a service
exports.bookService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { date, time, additionalRequests, paymentMethod } = req.body;
    const userId = req.user.id;
    
    // Validate booking data
    if (!date || !time) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide booking date and time'
      });
    }
    
    // Check if service exists
    const service = await LocalService.findById(serviceId);
    if (!service || !service.active) {
      return res.status(404).json({
        status: 'fail',
        message: 'Service not found'
      });
    }
    
    // Create the booking
    const newBooking = await ServiceBooking.create({
      service: serviceId,
      user: userId,
      date: new Date(date),
      time,
      additionalRequests,
      price: service.price.base,
      paymentMethod: paymentMethod || 'credit_card',
      status: 'confirmed' // Assuming payment is handled separately
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Service booked successfully',
      data: {
        booking: newBooking
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'bookService',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to book service'
    });
  }
};

// Get user bookings
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const bookings = await ServiceBooking.find({ user: userId })
      .sort({ date: -1 });
    
    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: {
        bookings
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'getUserBookings',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user bookings'
    });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;
    
    const booking = await ServiceBooking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        status: 'fail',
        message: 'Booking not found'
      });
    }
    
    // Check if booking belongs to user
    if (booking.user.id !== userId) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to cancel this booking'
      });
    }
    
    // Check if booking can be cancelled
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({
        status: 'fail',
        message: `Booking cannot be cancelled as it is already ${booking.status}`
      });
    }
    
    booking.status = 'cancelled';
    await booking.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Booking cancelled successfully',
      data: {
        booking
      }
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