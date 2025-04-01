const Booking = require("../models/Booking");
const TourBooking = require("../models/TourBooking");
const HotelBooking = require("../models/HotelBooking");
const FlightBooking = require("../models/FlightBooking");
const EventBooking = require("../models/EventBooking");
const ServiceBooking = require("../models/ServiceBooking");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("../utils/appResponse");

/**
 * Get all bookings for the logged in user across all booking types
 * @route GET /api/users/bookings
 * @access Private
 */
exports.getAllUserBookings = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  let bookings = [];

  try {
    // Get general bookings
    const generalBookings = await Booking.find({ user: userId })
      .populate({
        path: "item",
        select: "name description image images price location",
      })
      .lean();

    if (generalBookings && generalBookings.length > 0) {
      generalBookings.forEach((booking) => {
        booking.bookingType = "general";
      });
      bookings = [...bookings, ...generalBookings];
    }

    // Get hotel bookings if model exists
    if (HotelBooking) {
      const hotelBookings = await HotelBooking.find({ user: userId })
        .populate({
          path: "hotel",
          select: "name description images location price rating",
        })
        .lean();

      if (hotelBookings && hotelBookings.length > 0) {
        hotelBookings.forEach((booking) => {
          booking.bookingType = "hotel";
          booking.item = booking.hotel; // Standardize structure
          booking.itemType = "hotel";
        });
        bookings = [...bookings, ...hotelBookings];
      }
    }

    // Get tour bookings if model exists
    if (TourBooking) {
      const tourBookings = await TourBooking.find({ user: userId })
        .populate({
          path: "tour",
          select: "name description images location price rating duration",
        })
        .lean();

      if (tourBookings && tourBookings.length > 0) {
        tourBookings.forEach((booking) => {
          booking.bookingType = "tour";
          booking.item = booking.tour; // Standardize structure
          booking.itemType = "tour";
        });
        bookings = [...bookings, ...tourBookings];
      }
    }

    // Get flight bookings if model exists
    if (FlightBooking) {
      const flightBookings = await FlightBooking.find({ user: userId })
        .populate({
          path: "flight",
          select:
            "airline flightNumber from to departureTime arrivalTime price",
        })
        .lean();

      if (flightBookings && flightBookings.length > 0) {
        flightBookings.forEach((booking) => {
          booking.bookingType = "flight";
          booking.item = booking.flight; // Standardize structure
          booking.itemType = "flight";
        });
        bookings = [...bookings, ...flightBookings];
      }
    }

    // Get event bookings if model exists
    if (EventBooking) {
      const eventBookings = await EventBooking.find({ user: userId })
        .populate({
          path: "event",
          select: "name description images location price date duration",
        })
        .lean();

      if (eventBookings && eventBookings.length > 0) {
        eventBookings.forEach((booking) => {
          booking.bookingType = "event";
          booking.item = booking.event; // Standardize structure
          booking.itemType = "event";
        });
        bookings = [...bookings, ...eventBookings];
      }
    }

    // Get service bookings if model exists
    if (ServiceBooking) {
      const serviceBookings = await ServiceBooking.find({ user: userId })
        .populate({
          path: "service",
          select: "name description images location price category",
        })
        .lean();

      if (serviceBookings && serviceBookings.length > 0) {
        serviceBookings.forEach((booking) => {
          booking.bookingType = "service";
          booking.item = booking.service; // Standardize structure
          booking.itemType = "service";
        });
        bookings = [...bookings, ...serviceBookings];
      }
    }

    // Sort by date (most recent first)
    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Format all bookings for consistent response structure
    const formattedBookings = bookings.map((booking) =>
      formatBookingResponse(booking)
    );

    return sendSuccessResponse(
      res,
      formattedBookings,
      "User bookings retrieved successfully"
    );
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return next(new AppError("Failed to fetch all user bookings", 500));
  }
});

/**
 * Get booking details by ID
 * @route GET /api/users/bookings/:id
 * @access Private
 */
exports.getBookingById = catchAsync(async (req, res, next) => {
  const bookingId = req.params.id;
  const userId = req.user.id;
  let booking = null;

  // Try to find in each booking type
  try {
    // First check general bookings
    booking = await Booking.findOne({
      _id: bookingId,
      user: userId,
    }).populate("item");

    if (!booking) {
      // Check hotel bookings
      if (HotelBooking) {
        booking = await HotelBooking.findOne({
          _id: bookingId,
          user: userId,
        }).populate("hotel");

        if (booking) {
          booking = booking.toObject();
          booking.bookingType = "hotel";
          booking.item = booking.hotel;
          booking.itemType = "hotel";
        }
      }
    }

    if (!booking) {
      // Check tour bookings
      if (TourBooking) {
        booking = await TourBooking.findOne({
          _id: bookingId,
          user: userId,
        }).populate("tour");

        if (booking) {
          booking = booking.toObject();
          booking.bookingType = "tour";
          booking.item = booking.tour;
          booking.itemType = "tour";
        }
      }
    }

    if (!booking) {
      // Check flight bookings
      if (FlightBooking) {
        booking = await FlightBooking.findOne({
          _id: bookingId,
          user: userId,
        }).populate("flight");

        if (booking) {
          booking = booking.toObject();
          booking.bookingType = "flight";
          booking.item = booking.flight;
          booking.itemType = "flight";
        }
      }
    }

    if (!booking) {
      // Check event bookings
      if (EventBooking) {
        booking = await EventBooking.findOne({
          _id: bookingId,
          user: userId,
        }).populate("event");

        if (booking) {
          booking = booking.toObject();
          booking.bookingType = "event";
          booking.item = booking.event;
          booking.itemType = "event";
        }
      }
    }

    if (!booking) {
      // Check service bookings
      if (ServiceBooking) {
        booking = await ServiceBooking.findOne({
          _id: bookingId,
          user: userId,
        }).populate("service");

        if (booking) {
          booking = booking.toObject();
          booking.bookingType = "service";
          booking.item = booking.service;
          booking.itemType = "service";
        }
      }
    }

    if (!booking) {
      return next(new AppError("Booking not found", 404));
    }

    // Format the booking for consistent response structure
    const formattedBooking = formatBookingResponse(booking);

    return sendSuccessResponse(
      res,
      formattedBooking,
      "Booking details retrieved successfully"
    );
  } catch (error) {
    console.error("Error fetching booking details:", error);
    return next(new AppError("Failed to fetch booking details", 500));
  }
});

/**
 * Cancel a booking
 * @route PUT /api/users/bookings/:id/cancel
 * @access Private
 */
exports.cancelBooking = catchAsync(async (req, res, next) => {
  const bookingId = req.params.id;
  const userId = req.user.id;
  let booking = null;
  let bookingModel = null;
  let bookingType = null;

  // Find booking in different collections
  try {
    // Check general bookings first
    booking = await Booking.findOne({
      _id: bookingId,
      user: userId,
    });

    if (booking) {
      bookingModel = Booking;
      bookingType = "general";
    }

    if (!booking && HotelBooking) {
      booking = await HotelBooking.findOne({
        _id: bookingId,
        user: userId,
      });
      if (booking) {
        bookingModel = HotelBooking;
        bookingType = "hotel";
      }
    }

    if (!booking && TourBooking) {
      booking = await TourBooking.findOne({
        _id: bookingId,
        user: userId,
      });
      if (booking) {
        bookingModel = TourBooking;
        bookingType = "tour";
      }
    }

    if (!booking && FlightBooking) {
      booking = await FlightBooking.findOne({
        _id: bookingId,
        user: userId,
      });
      if (booking) {
        bookingModel = FlightBooking;
        bookingType = "flight";
      }
    }

    if (!booking && EventBooking) {
      booking = await EventBooking.findOne({
        _id: bookingId,
        user: userId,
      });
      if (booking) {
        bookingModel = EventBooking;
        bookingType = "event";
      }
    }

    if (!booking && ServiceBooking) {
      booking = await ServiceBooking.findOne({
        _id: bookingId,
        user: userId,
      });
      if (booking) {
        bookingModel = ServiceBooking;
        bookingType = "service";
      }
    }

    if (!booking) {
      return next(new AppError("Booking not found", 404));
    }

    // Check if booking can be cancelled
    if (booking.status === "cancelled") {
      return next(new AppError("This booking is already cancelled", 400));
    }

    if (booking.status === "completed") {
      return next(new AppError("Completed bookings cannot be cancelled", 400));
    }

    // Set booking status to cancelled
    booking.status = "cancelled";
    booking.cancellationDate = new Date();
    booking.cancellationReason = req.body.reason || "Cancelled by user";

    // Special handling for different booking types
    if (bookingType === "tour" && booking.tour) {
      // Update available spots for tour
      const tour = await Tour.findById(booking.tour);
      if (tour) {
        tour.availableSpots += booking.numberOfParticipants || 1;
        await tour.save();
      }
    } else if (bookingType === "event" && booking.event) {
      // Update available tickets for event
      const event = await Event.findById(booking.event);
      if (event) {
        event.availableTickets += booking.numberOfTickets || 1;
        await event.save();
      }
    }

    // Issue refund if already paid (could integrate with payment provider here)
    if (booking.paymentStatus === "completed") {
      booking.refundStatus = "pending";
      // In a real app, you would call your payment provider's refund API here
      // For now, we just mark it as refunded
      booking.refundStatus = "completed";
      booking.refundDate = new Date();
      booking.refundAmount = booking.totalPrice;
    }

    await booking.save();

    // Format the response
    const updatedBooking = await bookingModel
      .findById(booking._id)
      .populate(
        bookingType === "general"
          ? "item"
          : bookingType === "hotel"
          ? "hotel"
          : bookingType === "tour"
          ? "tour"
          : bookingType === "flight"
          ? "flight"
          : bookingType === "event"
          ? "event"
          : "service"
      );

    // Format the booking for consistent response structure
    const formattedBooking = formatBookingResponse(updatedBooking);

    return sendSuccessResponse(
      res,
      formattedBooking,
      "Booking cancelled successfully",
      200
    );
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return next(new AppError("Failed to cancel booking", 500));
  }
});

/**
 * Standard response formatter for booking data
 * @param {Object} booking - Raw booking data
 * @returns {Object} - Standardized booking data
 */
const formatBookingResponse = (booking) => {
  if (!booking) return null;

  // Convert to plain object if it's a Mongoose document
  const bookingData = booking.toObject ? booking.toObject() : booking;

  // Determine item and item type for consistency
  const itemData = {
    item:
      bookingData.item ||
      bookingData.hotel ||
      bookingData.tour ||
      bookingData.flight ||
      bookingData.event ||
      bookingData.service ||
      null,
    itemType:
      bookingData.itemType ||
      (bookingData.hotel
        ? "hotel"
        : bookingData.tour
        ? "tour"
        : bookingData.flight
        ? "flight"
        : bookingData.event
        ? "event"
        : bookingData.service
        ? "service"
        : "general"),
  };

  // Standard booking response
  return {
    _id: bookingData._id,
    createdAt: bookingData.createdAt,
    bookingDate: bookingData.bookingDate || bookingData.createdAt,
    startDate:
      bookingData.startDate || bookingData.checkInDate || bookingData.date,
    endDate: bookingData.endDate || bookingData.checkOutDate,
    status: bookingData.status || "pending",
    paymentStatus: bookingData.paymentStatus || "pending",
    totalPrice: bookingData.totalPrice || bookingData.price || 0,
    user: bookingData.user,
    guests: bookingData.guests || bookingData.numberOfGuests || 1,
    bookingType: bookingData.bookingType || itemData.itemType,
    itemType: itemData.itemType,
    item: itemData.item,
    confirmationCode:
      bookingData.confirmationCode ||
      bookingData._id.toString().slice(-8).toUpperCase(),
  };
};
