const Restaurant = require('../models/Restaurant');
const ErrorLog = require('../models/ErrorLog');
const { validationResult } = require('express-validator');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Get all restaurants with filtering
exports.getAllRestaurants = async (req, res) => {
  try {
    // Build filter object
    const filter = { active: true };
    
    // Process query params
    if (req.query.cuisineType) {
      filter.cuisineType = { $in: req.query.cuisineType.split(',') };
    }
    
    if (req.query.minPrice && req.query.maxPrice) {
      filter.priceLevel = {
        $gte: parseInt(req.query.minPrice),
        $lte: parseInt(req.query.maxPrice)
      };
    } else if (req.query.minPrice) {
      filter.priceLevel = { $gte: parseInt(req.query.minPrice) };
    } else if (req.query.maxPrice) {
      filter.priceLevel = { $lte: parseInt(req.query.maxPrice) };
    }
    
    if (req.query.features) {
      const features = req.query.features.split(',');
      
      features.forEach(feature => {
        if (feature === 'delivery') {
          filter['features.delivery'] = true;
        } else if (feature === 'takeout') {
          filter['features.takeout'] = true;
        } else if (feature === 'reservations') {
          filter['features.reservations'] = true;
        } else if (feature === 'outdoor') {
          filter['features.outdoor'] = true;
        }
      });
    }
    
    if (req.query.rating) {
      filter.averageRating = { $gte: parseFloat(req.query.rating) };
    }
    
    // Handle location-based search
    if (req.query.near) {
      const [lng, lat] = req.query.near.split(',').map(Number);
      const distance = req.query.distance ? parseInt(req.query.distance) * 1000 : 10000; // Convert to meters, default 10km
      
      if (!isNaN(lng) && !isNaN(lat)) {
        return res.status(200).json({
          status: 'success',
          results: await Restaurant.countDocuments(filter),
          data: {
            restaurants: await Restaurant.getRestaurantsNearby(lng, lat, distance, 50)
          }
        });
      }
    }
    
    // Sorting
    let sortBy = { averageRating: -1 };
    if (req.query.sort) {
      if (req.query.sort === 'priceAsc') {
        sortBy = { priceLevel: 1 };
      } else if (req.query.sort === 'priceDesc') {
        sortBy = { priceLevel: -1 };
      } else if (req.query.sort === 'rating') {
        sortBy = { averageRating: -1 };
      } else if (req.query.sort === 'newest') {
        sortBy = { createdAt: -1 };
      }
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Execute query
    const restaurants = await Restaurant.find(filter)
      .sort(sortBy)
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Restaurant.countDocuments(filter);
    
    res.status(200).json({
      status: 'success',
      results: restaurants.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      data: {
        restaurants
      }
    });
  } catch (error) {
    console.error(error);
    await ErrorLog.create({
      method: 'getAllRestaurants',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve restaurants',
      error: error.message
    });
  }
};

// Get a single restaurant by ID
exports.getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant || !restaurant.active) {
      return res.status(404).json({
        status: 'fail',
        message: 'Restaurant not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        restaurant
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'getRestaurant',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve restaurant'
    });
  }
};

// Create a new restaurant (admin only)
exports.createRestaurant = async (req, res) => {
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
      req.body.location = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
      };
      
      // Remove the latitude/longitude from the body as they're now in location
      delete req.body.latitude;
      delete req.body.longitude;
    }
    
    // Process cuisineType - ensure it's an array
    if (typeof req.body.cuisineType === 'string') {
      req.body.cuisineType = req.body.cuisineType.split(',');
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
    
    // Create the restaurant
    const restaurant = await Restaurant.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: {
        restaurant
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'createRestaurant',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to create restaurant',
      error: error.message
    });
  }
};

// Update a restaurant (admin only)
exports.updateRestaurant = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    // Find the restaurant
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({
        status: 'fail',
        message: 'Restaurant not found'
      });
    }
    
    // Process location data
    if (req.body.latitude && req.body.longitude) {
      req.body.location = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
      };
      
      // Remove the latitude/longitude from the body as they're now in location
      delete req.body.latitude;
      delete req.body.longitude;
    }
    
    // Process cuisineType - ensure it's an array
    if (typeof req.body.cuisineType === 'string') {
      req.body.cuisineType = req.body.cuisineType.split(',');
    }
    
    // Handle image uploads if any
    if (req.files) {
      // Process cover image
      if (req.files.coverImage) {
        // Delete old cover image if it exists and isn't the default
        if (restaurant.coverImage && restaurant.coverImage !== 'default-restaurant.jpg') {
          const coverImagePath = path.join(__dirname, '../../public/uploads/restaurants', restaurant.coverImage);
          if (fs.existsSync(coverImagePath)) {
            fs.unlinkSync(coverImagePath);
          }
        }
        
        req.body.coverImage = req.files.coverImage[0].filename;
      }
      
      // Process additional images
      if (req.files.images) {
        const images = [...(restaurant.images || [])];
        
        req.files.images.forEach(file => {
          images.push(file.filename);
        });
        
        req.body.images = images;
      }
    }
    
    // Update the restaurant
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        restaurant: updatedRestaurant
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'updateRestaurant',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to update restaurant',
      error: error.message
    });
  }
};

// Delete a restaurant (admin only - soft delete)
exports.deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    
    if (!restaurant) {
      return res.status(404).json({
        status: 'fail',
        message: 'Restaurant not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: null,
      message: 'Restaurant deleted successfully'
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'deleteRestaurant',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete restaurant'
    });
  }
};

// Get restaurants by cuisine type
exports.getRestaurantsByCuisine = async (req, res) => {
  try {
    const { cuisine } = req.params;
    
    const restaurants = await Restaurant.findByCuisineType(cuisine);
    
    res.status(200).json({
      status: 'success',
      results: restaurants.length,
      data: {
        restaurants
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'getRestaurantsByCuisine',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve restaurants'
    });
  }
};

// Get menu for a restaurant
exports.getRestaurantMenu = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant || !restaurant.active) {
      return res.status(404).json({
        status: 'fail',
        message: 'Restaurant not found'
      });
    }
    
    // Group menu items by category
    const menu = {};
    
    restaurant.menu.forEach(item => {
      if (!menu[item.category]) {
        menu[item.category] = [];
      }
      
      menu[item.category].push(item);
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        menu
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'getRestaurantMenu',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve restaurant menu'
    });
  }
};

// Add a menu item to restaurant (admin only)
exports.addMenuItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({
        status: 'fail',
        message: 'Restaurant not found'
      });
    }
    
    // Handle image upload for menu item if provided
    if (req.file) {
      req.body.image = req.file.filename;
    }
    
    // Add the new menu item
    restaurant.menu.push(req.body);
    await restaurant.save();
    
    const addedMenuItem = restaurant.menu[restaurant.menu.length - 1];
    
    res.status(201).json({
      status: 'success',
      data: {
        menuItem: addedMenuItem
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'addMenuItem',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to add menu item'
    });
  }
};

// Update a menu item (admin only)
exports.updateMenuItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { id, menuItemId } = req.params;
    
    // Handle image upload if provided
    if (req.file) {
      req.body.image = req.file.filename;
    }
    
    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) {
      return res.status(404).json({
        status: 'fail',
        message: 'Restaurant not found'
      });
    }
    
    // Find the menu item
    const menuItemIndex = restaurant.menu.findIndex(item => item._id.toString() === menuItemId);
    
    if (menuItemIndex === -1) {
      return res.status(404).json({
        status: 'fail',
        message: 'Menu item not found'
      });
    }
    
    // Update the menu item
    Object.keys(req.body).forEach(key => {
      restaurant.menu[menuItemIndex][key] = req.body[key];
    });
    
    await restaurant.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        menuItem: restaurant.menu[menuItemIndex]
      }
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'updateMenuItem',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to update menu item'
    });
  }
};

// Remove a menu item (admin only)
exports.removeMenuItem = async (req, res) => {
  try {
    const { id, menuItemId } = req.params;
    
    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) {
      return res.status(404).json({
        status: 'fail',
        message: 'Restaurant not found'
      });
    }
    
    // Find and remove the menu item
    const menuItemIndex = restaurant.menu.findIndex(item => item._id.toString() === menuItemId);
    
    if (menuItemIndex === -1) {
      return res.status(404).json({
        status: 'fail',
        message: 'Menu item not found'
      });
    }
    
    // Remove the menu item
    restaurant.menu.splice(menuItemIndex, 1);
    await restaurant.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Menu item removed successfully',
      data: null
    });
  } catch (error) {
    await ErrorLog.create({
      method: 'removeMenuItem',
      endpoint: req.originalUrl,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove menu item'
    });
  }
}; 