const Favorite = require("../models/Favorite");
const Hotel = require("../models/Hotel");
const Tour = require("../models/Tour");
const Restaurant = require("../models/Restaurant");
const LocalService = require("../models/LocalService");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

/**
 * Get all favorites for the logged in user
 * @route GET /api/users/favorites
 * @access Private
 */
exports.getFavorites = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const favorites = await Favorite.find({ user: userId }).populate({
    path: "itemId",
    select:
      "name description image images price location destination rating reviews",
  });

  res.status(200).json(favorites);
});

/**
 * Add an item to favorites
 * @route POST /api/users/favorites/:itemType/:itemId
 * @access Private
 */
exports.addFavorite = catchAsync(async (req, res, next) => {
  const { itemType, itemId } = req.params;
  const userId = req.user.id;

  // Validate item type
  const validItemTypes = ["hotel", "tour", "restaurant", "service"];
  if (!validItemTypes.includes(itemType)) {
    return next(
      new AppError(
        `Invalid item type. Must be one of: ${validItemTypes.join(", ")}`,
        400
      )
    );
  }

  // Check if the item exists
  let item;
  switch (itemType) {
    case "hotel":
      item = await Hotel.findById(itemId);
      break;
    case "tour":
      item = await Tour.findById(itemId);
      break;
    case "restaurant":
      item = await Restaurant.findById(itemId);
      break;
    case "service":
      item = await LocalService.findById(itemId);
      break;
  }

  if (!item) {
    return next(
      new AppError(
        `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} not found`,
        404
      )
    );
  }

  // Check if already in favorites
  const existingFavorite = await Favorite.findOne({
    user: userId,
    itemType,
    itemId,
  });

  if (existingFavorite) {
    return next(
      new AppError(`This ${itemType} is already in your favorites`, 400)
    );
  }

  // Add to favorites
  const favorite = await Favorite.create({
    user: userId,
    itemType,
    itemId,
    addedOn: new Date(),
  });

  res.status(201).json({
    success: true,
    data: favorite,
  });
});

/**
 * Remove an item from favorites
 * @route DELETE /api/users/favorites/:itemType/:itemId
 * @access Private
 */
exports.removeFavorite = catchAsync(async (req, res, next) => {
  const { itemType, itemId } = req.params;
  const userId = req.user.id;

  // Check if in favorites
  const favorite = await Favorite.findOne({
    user: userId,
    itemType,
    itemId,
  });

  if (!favorite) {
    return next(new AppError(`This ${itemType} is not in your favorites`, 404));
  }

  // Remove from favorites
  await favorite.deleteOne();

  res.status(200).json({
    success: true,
    message: `${
      itemType.charAt(0).toUpperCase() + itemType.slice(1)
    } has been removed from your favorites`,
  });
});
