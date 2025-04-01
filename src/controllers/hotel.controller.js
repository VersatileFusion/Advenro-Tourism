const Hotel = require("../models/Hotel");
const { cacheQuery } = require("../middleware/cache");
const mongoose = require("mongoose");

// Get all hotels with optimized query and caching
exports.getAllHotels = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "-createdAt",
      fields,
      location,
    } = req.query;

    // Build query
    const query = {};
    if (location) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: location.split(",").map(Number),
          },
          $maxDistance: 10000, // 10km
        },
      };
    }

    // Create cache key based on query parameters
    const cacheKey = `hotels:${page}:${limit}:${sort}:${fields}:${location}`;

    const hotels = await cacheQuery(cacheKey, 300, async () => {
      // Optimized query with lean() and specific field selection
      const queryBuilder = Hotel.find(query)
        .lean() // Returns plain JavaScript objects instead of Mongoose documents
        .select(fields ? fields.split(",").join(" ") : "")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate({
          path: "amenities",
          select: "name icon -_id",
        });

      // Use explain() to analyze query performance
      if (process.env.NODE_ENV === "development") {
        const explanation = await queryBuilder.explain();
        console.log("Query explanation:", JSON.stringify(explanation, null, 2));
      }

      return queryBuilder.exec();
    });

    // Get total count for pagination
    const total = await Hotel.countDocuments(query);

    res.json({
      success: true,
      count: hotels.length,
      total,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
      },
      data: hotels,
    });
  } catch (error) {
    console.error("Error in getAllHotels:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// Get single hotel with optimized query
exports.getHotelById = async (req, res) => {
  try {
    const cacheKey = `hotel:${req.params.id}`;

    const hotel = await cacheQuery(cacheKey, 300, async () => {
      return Hotel.findById(req.params.id)
        .lean()
        .populate({
          path: "amenities",
          select: "name icon -_id",
        })
        .populate({
          path: "reviews",
          select: "rating comment user createdAt -_id",
          populate: {
            path: "user",
            select: "name avatar -_id",
          },
        })
        .exec();
    });

    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: "Hotel not found",
      });
    }

    res.json({
      success: true,
      data: hotel,
    });
  } catch (error) {
    console.error("Error in getHotelById:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};
