const express = require("express");
const router = express.Router();
const Hotel = require("../models/Hotel");
const Review = require("../models/Review");
const { authenticate } = require("../middleware/auth");
const admin = require("../middleware/admin");
const Room = require("../models/Room");

// Get all hotels
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const hotels = await Hotel.find()
      .select("name description city country address price rating images")
      .skip(skip)
      .limit(limit);

    const total = await Hotel.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.json({
      hotels,
      currentPage: page,
      totalPages,
      totalHotels: total
    });
  } catch (error) {
    console.error("Error in get hotels:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Search hotels
router.get("/search", async (req, res) => {
  try {
    const {
      city,
      country,
      minPrice,
      maxPrice,
      rating,
      amenities,
      checkIn,
      checkOut,
      page,
      limit
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter = {};

    if (city) filter.city = new RegExp(city, "i");
    if (country) filter.country = new RegExp(country, "i");

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    if (rating) filter.rating = { $gte: parseInt(rating) };

    if (amenities) {
      const amenitiesArray = amenities.split(",");
      filter.amenities = { $all: amenitiesArray };
    }

    // Execute search query with pagination
    const hotels = await Hotel.find(filter)
      .select("name description city country address price rating images")
      .skip(skip)
      .limit(limitNum);

    const total = await Hotel.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      hotels,
      currentPage: pageNum,
      totalPages,
      totalHotels: total
    });
  } catch (error) {
    console.error("Error in search hotels:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get featured hotels
router.get("/featured", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    
    // Simplified query - just get some hotels sorted by rating
    const featuredHotels = await Hotel.find()
      .sort({ rating: -1 })
      .limit(limit)
      .select("name description city country price rating images");
    
    res.json({
      success: true,
      data: featuredHotels
    });
  } catch (error) {
    console.error("Error getting featured hotels:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get popular destinations
router.get("/popular-destinations", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    // Simplified approach - just return some cities from the hotels
    const hotels = await Hotel.find()
      .select("city country images")
      .limit(20);
      
    // Extract unique cities
    const citiesMap = {};
    hotels.forEach(hotel => {
      const key = `${hotel.city}-${hotel.country}`;
      if (!citiesMap[key]) {
        citiesMap[key] = {
          city: hotel.city,
          country: hotel.country,
          image: hotel.images && hotel.images.length > 0 ? hotel.images[0] : null,
          hotelCount: 1
        };
      } else {
        citiesMap[key].hotelCount++;
      }
    });
    
    // Convert to array and sort by hotel count
    const destinations = Object.values(citiesMap)
      .sort((a, b) => b.hotelCount - a.hotelCount)
      .slice(0, limit);
    
    res.json({
      success: true,
      data: destinations
    });
  } catch (error) {
    console.error("Error getting popular destinations:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get hotel by ID
router.get("/:id", async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }
    res.json(hotel);
  } catch (error) {
    console.error("Error in get hotel details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get hotel availability
router.get("/:id/availability", async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        message: "Check-in and check-out dates are required"
      });
    }

    // Validate date format
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate) || isNaN(checkOutDate)) {
      return res.status(400).json({
        message: "Invalid date format. Use YYYY-MM-DD"
      });
    }

    // Ensure check-out is after check-in
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        message: "Check-out date must be after check-in date"
      });
    }

    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // Get rooms for this hotel
    // In a real application, you would check bookings to determine availability
    const rooms = await Room.find({ hotelId: req.params.id });

    // Mock availability calculation
    // In a real app, you would filter out rooms that are already booked
    const availableRooms = rooms.map(room => ({
      _id: room._id,
      type: room.type,
      description: room.description,
      price: room.price,
      capacity: room.capacity,
      bedType: room.bedType,
      amenities: room.amenities
    }));

    res.json({
      hotelId: hotel._id,
      hotelName: hotel.name,
      checkIn,
      checkOut,
      rooms: availableRooms
    });
  } catch (error) {
    console.error("Error in get hotel availability:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get hotel reviews
router.get("/:id/reviews", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const reviews = await Review.find({ hotelId: req.params.id })
      .populate("userId", "name")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    // Format reviews for frontend
    const formattedReviews = reviews.map(review => ({
      _id: review._id,
      userId: review.userId?._id,
      userName: review.userId?.name || "Anonymous",
      rating: review.rating,
      comment: review.comment,
      date: review.date
    }));

    const total = await Review.countDocuments({ hotelId: req.params.id });
    const totalPages = Math.ceil(total / limit);

    res.json({
      hotelId: hotel._id,
      hotelName: hotel.name,
      reviews: formattedReviews,
      currentPage: page,
      totalPages,
      totalReviews: total
    });
  } catch (error) {
    console.error("Error in get hotel reviews:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create hotel review
router.post("/:id/reviews", authenticate, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating is required and must be between 1 and 5" });
    }

    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // Check if the user has already reviewed this hotel
    const existingReview = await Review.findOne({
      hotelId: req.params.id,
      userId: req.user.id
    });

    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this hotel" });
    }

    // Create new review
    const newReview = new Review({
      hotelId: req.params.id,
      userId: req.user.id,
      rating,
      comment: comment || "",
      date: new Date()
    });

    await newReview.save();

    // Update hotel rating
    const allReviews = await Review.find({ hotelId: req.params.id });
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / allReviews.length;

    hotel.rating = averageRating;
    await hotel.save();

    res.status(201).json(newReview);
  } catch (error) {
    console.error("Error in create hotel review:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get hotel amenities
router.get("/:id/amenities", async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // If the hotel has amenities, return them, otherwise use default amenities
    const amenities = hotel.amenities && hotel.amenities.length > 0
      ? hotel.amenities
      : [
        "Free WiFi",
        "Air Conditioning",
        "Flat-screen TV",
        "Private Bathroom",
        "Restaurant",
        "Room Service",
        "Swimming Pool",
        "Fitness Center",
        "Breakfast Available",
        "Parking"
      ];

    res.json(amenities);
  } catch (error) {
    console.error("Error in get hotel amenities:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get hotel room details
router.get("/:id/rooms", async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    res.json({
      success: true,
      data: hotel.rooms || [],
    });
  } catch (error) {
    console.error("Error fetching hotel rooms:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching hotel rooms",
      error: error.message,
    });
  }
});

// Create hotel (admin only)
router.post("/", authenticate, admin, async (req, res) => {
  try {
    const hotel = new Hotel(req.body);
    await hotel.save();
    res.status(201).json({
      success: true,
      data: hotel,
    });
  } catch (error) {
    console.error("Error creating hotel:", error);
    res.status(400).json({
      success: false,
      message: "Error creating hotel",
      error: error.message,
    });
  }
});

// Update hotel (admin only)
router.put("/:id", authenticate, admin, async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }
    res.json({
      success: true,
      data: hotel,
    });
  } catch (error) {
    console.error("Error updating hotel:", error);
    res.status(400).json({
      success: false,
      message: "Error updating hotel",
      error: error.message,
    });
  }
});

// Delete hotel (admin only)
router.delete("/:id", authenticate, admin, async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }
    res.json({
      success: true,
      message: "Hotel deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting hotel:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting hotel",
      error: error.message,
    });
  }
});

module.exports = router;
