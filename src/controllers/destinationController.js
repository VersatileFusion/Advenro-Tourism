const Destination = require("../models/Destination");
const Tour = require("../models/Tour");
const Hotel = require("../models/Hotel");
const Restaurant = require("../models/Restaurant");
const Attraction = require("../models/Attraction");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/appResponse");

/**
 * Search destinations by name or description
 * @route GET /api/destinations/search
 * @access Public
 */
exports.searchDestinations = catchAsync(async (req, res, next) => {
  const query = req.query.q;

  if (!query) {
    return next(new AppError("Search query is required", 400));
  }

  // Create a regex for case-insensitive search
  const searchRegex = new RegExp(query, "i");

  try {
    // Search in destinations
    const destinations = await Destination.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { "location.city": searchRegex },
        { "location.country": searchRegex },
      ],
    })
      .select("name description image images location rating")
      .limit(10);

    // If we have models for related collections, search in them too
    let relatedItems = [];

    // Search in hotels if model exists
    if (Hotel) {
      const hotels = await Hotel.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { "location.city": searchRegex },
          { "location.country": searchRegex },
        ],
      })
        .select("name description images location rating price itemType")
        .limit(5);

      // Add itemType for frontend differentiation
      hotels.forEach((hotel) => {
        hotel._doc.itemType = "hotel";
      });

      relatedItems = [...relatedItems, ...hotels];
    }

    // Search in tours if model exists
    if (Tour) {
      const tours = await Tour.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { "location.city": searchRegex },
          { "location.country": searchRegex },
        ],
      })
        .select("name description images location rating price duration")
        .limit(5);

      // Add itemType for frontend differentiation
      tours.forEach((tour) => {
        tour._doc.itemType = "tour";
      });

      relatedItems = [...relatedItems, ...tours];
    }

    // Search in restaurants if model exists
    if (Restaurant) {
      const restaurants = await Restaurant.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { "location.city": searchRegex },
          { "location.country": searchRegex },
          { cuisine: searchRegex },
        ],
      })
        .select("name description images location rating price cuisine")
        .limit(5);

      // Add itemType for frontend differentiation
      restaurants.forEach((restaurant) => {
        restaurant._doc.itemType = "restaurant";
      });

      relatedItems = [...relatedItems, ...restaurants];
    }

    // Search in attractions if model exists
    if (Attraction) {
      const attractions = await Attraction.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { "location.city": searchRegex },
          { "location.country": searchRegex },
          { category: searchRegex },
        ],
      })
        .select("name description images location rating price category")
        .limit(5);

      // Add itemType for frontend differentiation
      attractions.forEach((attraction) => {
        attraction._doc.itemType = "attraction";
      });

      relatedItems = [...relatedItems, ...attractions];
    }

    // Return results using standard response format
    return sendSuccessResponse(
      res,
      {
        destinations,
        relatedItems,
      },
      "Search results retrieved successfully"
    );
  } catch (error) {
    console.error("Error searching destinations:", error);
    return next(new AppError("Failed to search destinations", 500));
  }
});

/**
 * Get destination by ID
 * @route GET /api/destinations/:id
 * @access Public
 */
exports.getDestination = catchAsync(async (req, res, next) => {
  try {
    const destination = await Destination.findById(req.params.id);

    if (!destination) {
      return next(new AppError("Destination not found", 404));
    }

    return sendSuccessResponse(
      res,
      destination,
      "Destination retrieved successfully"
    );
  } catch (error) {
    console.error("Error fetching destination:", error);
    return next(new AppError("Failed to fetch destination details", 500));
  }
});

/**
 * Get popular destinations
 * @route GET /api/destinations/popular
 * @access Public
 */
exports.getPopularDestinations = catchAsync(async (req, res, next) => {
  try {
    // Get destinations sorted by rating or views
    const destinations = await Destination.find()
      .sort({ rating: -1 }) // Sort by highest rating first
      .limit(10)
      .select("name description image images location rating");

    return sendSuccessResponse(
      res,
      destinations,
      "Popular destinations retrieved successfully"
    );
  } catch (error) {
    console.error("Error fetching popular destinations:", error);
    return next(new AppError("Failed to fetch popular destinations", 500));
  }
});
