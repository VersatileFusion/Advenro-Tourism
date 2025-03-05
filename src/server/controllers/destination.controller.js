const { Destination, Hotel, Review, User } = require('../../models');
const { uploadToCloud } = require('../utils/cloudStorage');
const { handleError } = require('../utils/error');

// Get all destinations with filtering and pagination
exports.getAllDestinations = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            country,
            region,
            climate,
            rating,
            sortBy = 'popularity',
            sortOrder = 'desc'
        } = req.query;

        const query = { isActive: true };

        // Apply filters
        if (country) query.country = country;
        if (region) query.region = region;
        if (climate) query['climate.type'] = climate;
        if (rating) query.rating = { $gte: parseFloat(rating) };

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query with pagination
        const destinations = await Destination.find(query)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('hotels', 'name rating price');

        const total = await Destination.countDocuments(query);

        res.json({
            success: true,
            data: destinations,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Search destinations
exports.searchDestinations = async (req, res) => {
    try {
        const { query, country, region, tags, page = 1, limit = 10 } = req.query;

        const searchQuery = { isActive: true };

        // Text search
        if (query) {
            searchQuery.$text = { $search: query };
        }

        // Filters
        if (country) searchQuery.country = country;
        if (region) searchQuery.region = region;
        if (tags) searchQuery.tags = { $in: tags.split(',') };

        const destinations = await Destination.find(searchQuery)
            .sort({ score: { $meta: 'textScore' } })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('hotels', 'name rating price');

        const total = await Destination.countDocuments(searchQuery);

        res.json({
            success: true,
            data: destinations,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Get destination recommendations
exports.getRecommendations = async (req, res) => {
    try {
        const recommendations = await Destination.getRecommendations(req.user.userId);
        res.json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Get destination by ID
exports.getDestinationById = async (req, res) => {
    try {
        const destination = await Destination.findById(req.params.id)
            .populate('hotels', 'name rating price images')
            .populate('reviews');

        if (!destination) {
            return res.status(404).json({
                success: false,
                message: 'Destination not found'
            });
        }

        res.json({
            success: true,
            data: destination
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Get destination attractions
exports.getDestinationAttractions = async (req, res) => {
    try {
        const destination = await Destination.findById(req.params.id)
            .select('attractions');

        if (!destination) {
            return res.status(404).json({
                success: false,
                message: 'Destination not found'
            });
        }

        res.json({
            success: true,
            data: destination.attractions
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Get destination hotels
exports.getDestinationHotels = async (req, res) => {
    try {
        const hotels = await Hotel.find({ destination: req.params.id })
            .select('name rating price images amenities');

        res.json({
            success: true,
            data: hotels
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Get destination activities
exports.getDestinationActivities = async (req, res) => {
    try {
        const destination = await Destination.findById(req.params.id)
            .select('activities');

        if (!destination) {
            return res.status(404).json({
                success: false,
                message: 'Destination not found'
            });
        }

        res.json({
            success: true,
            data: destination.activities
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Get destination cuisine
exports.getDestinationCuisine = async (req, res) => {
    try {
        const destination = await Destination.findById(req.params.id)
            .select('cuisine');

        if (!destination) {
            return res.status(404).json({
                success: false,
                message: 'Destination not found'
            });
        }

        res.json({
            success: true,
            data: destination.cuisine
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Toggle favorite destination
exports.toggleFavorite = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        const destination = await Destination.findById(req.params.id);

        if (!destination) {
            return res.status(404).json({
                success: false,
                message: 'Destination not found'
            });
        }

        const favoriteIndex = user.favorites.findIndex(
            fav => fav.item.toString() === destination._id.toString() && fav.type === 'Destination'
        );

        if (favoriteIndex === -1) {
            user.favorites.push({
                item: destination._id,
                type: 'Destination'
            });
        } else {
            user.favorites.splice(favoriteIndex, 1);
        }

        await user.save();

        res.json({
            success: true,
            message: favoriteIndex === -1 ? 'Added to favorites' : 'Removed from favorites'
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Create destination review
exports.createReview = async (req, res) => {
    try {
        const destination = await Destination.findById(req.params.id);
        if (!destination) {
            return res.status(404).json({
                success: false,
                message: 'Destination not found'
            });
        }

        const review = new Review({
            ...req.body,
            user: req.user.userId,
            destination: destination._id
        });

        await review.save();
        destination.reviews.push(review._id);
        await destination.save();
        await destination.calculateRating();

        res.status(201).json({
            success: true,
            data: review
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Update destination review
exports.updateReview = async (req, res) => {
    try {
        const review = await Review.findOne({
            _id: req.params.reviewId,
            user: req.user.userId,
            destination: req.params.id
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        Object.assign(review, req.body);
        await review.save();

        const destination = await Destination.findById(req.params.id);
        await destination.calculateRating();

        res.json({
            success: true,
            data: review
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Delete destination review
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findOneAndDelete({
            _id: req.params.reviewId,
            user: req.user.userId,
            destination: req.params.id
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        const destination = await Destination.findById(req.params.id);
        destination.reviews = destination.reviews.filter(
            reviewId => reviewId.toString() !== review._id.toString()
        );
        await destination.save();
        await destination.calculateRating();

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Create new destination (admin only)
exports.createDestination = async (req, res) => {
    try {
        const imageUrls = await Promise.all(
            req.files.map(file => uploadToCloud(file, 'destinations'))
        );

        const destination = new Destination({
            ...req.body,
            images: imageUrls
        });

        await destination.save();

        res.status(201).json({
            success: true,
            data: destination
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Update destination (admin only)
exports.updateDestination = async (req, res) => {
    try {
        const destination = await Destination.findById(req.params.id);
        if (!destination) {
            return res.status(404).json({
                success: false,
                message: 'Destination not found'
            });
        }

        let imageUrls = destination.images;
        if (req.files && req.files.length > 0) {
            const newImageUrls = await Promise.all(
                req.files.map(file => uploadToCloud(file, 'destinations'))
            );
            imageUrls = [...imageUrls, ...newImageUrls];
        }

        Object.assign(destination, req.body, { images: imageUrls });
        await destination.save();

        res.json({
            success: true,
            data: destination
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Delete destination (admin only)
exports.deleteDestination = async (req, res) => {
    try {
        const destination = await Destination.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!destination) {
            return res.status(404).json({
                success: false,
                message: 'Destination not found'
            });
        }

        res.json({
            success: true,
            message: 'Destination deleted successfully'
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Add attraction to destination (admin only)
exports.addAttraction = async (req, res) => {
    try {
        const destination = await Destination.findById(req.params.id);
        if (!destination) {
            return res.status(404).json({
                success: false,
                message: 'Destination not found'
            });
        }

        let attractionImages = [];
        if (req.files && req.files.length > 0) {
            attractionImages = await Promise.all(
                req.files.map(file => uploadToCloud(file, 'attractions'))
            );
        }

        const attraction = {
            ...req.body,
            images: attractionImages
        };

        destination.attractions.push(attraction);
        await destination.save();

        res.status(201).json({
            success: true,
            data: attraction
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Update attraction (admin only)
exports.updateAttraction = async (req, res) => {
    try {
        const destination = await Destination.findById(req.params.id);
        if (!destination) {
            return res.status(404).json({
                success: false,
                message: 'Destination not found'
            });
        }

        const attraction = destination.attractions.id(req.params.attractionId);
        if (!attraction) {
            return res.status(404).json({
                success: false,
                message: 'Attraction not found'
            });
        }

        let images = attraction.images;
        if (req.files && req.files.length > 0) {
            const newImages = await Promise.all(
                req.files.map(file => uploadToCloud(file, 'attractions'))
            );
            images = [...images, ...newImages];
        }

        Object.assign(attraction, req.body, { images });
        await destination.save();

        res.json({
            success: true,
            data: attraction
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Delete attraction (admin only)
exports.deleteAttraction = async (req, res) => {
    try {
        const destination = await Destination.findById(req.params.id);
        if (!destination) {
            return res.status(404).json({
                success: false,
                message: 'Destination not found'
            });
        }

        destination.attractions = destination.attractions.filter(
            attraction => attraction._id.toString() !== req.params.attractionId
        );
        await destination.save();

        res.json({
            success: true,
            message: 'Attraction deleted successfully'
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Add activity to destination (admin only)
exports.addActivity = async (req, res) => {
    try {
        const destination = await Destination.findById(req.params.id);
        if (!destination) {
            return res.status(404).json({
                success: false,
                message: 'Destination not found'
            });
        }

        destination.activities.push(req.body);
        await destination.save();

        res.status(201).json({
            success: true,
            data: destination.activities[destination.activities.length - 1]
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Update activity (admin only)
exports.updateActivity = async (req, res) => {
    try {
        const destination = await Destination.findById(req.params.id);
        if (!destination) {
            return res.status(404).json({
                success: false,
                message: 'Destination not found'
            });
        }

        const activity = destination.activities.id(req.params.activityId);
        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Activity not found'
            });
        }

        Object.assign(activity, req.body);
        await destination.save();

        res.json({
            success: true,
            data: activity
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Delete activity (admin only)
exports.deleteActivity = async (req, res) => {
    try {
        const destination = await Destination.findById(req.params.id);
        if (!destination) {
            return res.status(404).json({
                success: false,
                message: 'Destination not found'
            });
        }

        destination.activities = destination.activities.filter(
            activity => activity._id.toString() !== req.params.activityId
        );
        await destination.save();

        res.json({
            success: true,
            message: 'Activity deleted successfully'
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Add cuisine to destination (admin only)
exports.addCuisine = async (req, res) => {
    try {
        const destination = await Destination.findById(req.params.id);
        if (!destination) {
            return res.status(404).json({
                success: false,
                message: 'Destination not found'
            });
        }

        destination.cuisine.push(req.body);
        await destination.save();

        res.status(201).json({
            success: true,
            data: destination.cuisine[destination.cuisine.length - 1]
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Update cuisine (admin only)
exports.updateCuisine = async (req, res) => {
    try {
        const destination = await Destination.findById(req.params.id);
        if (!destination) {
            return res.status(404).json({
                success: false,
                message: 'Destination not found'
            });
        }

        const cuisine = destination.cuisine.id(req.params.cuisineId);
        if (!cuisine) {
            return res.status(404).json({
                success: false,
                message: 'Cuisine not found'
            });
        }

        Object.assign(cuisine, req.body);
        await destination.save();

        res.json({
            success: true,
            data: cuisine
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Delete cuisine (admin only)
exports.deleteCuisine = async (req, res) => {
    try {
        const destination = await Destination.findById(req.params.id);
        if (!destination) {
            return res.status(404).json({
                success: false,
                message: 'Destination not found'
            });
        }

        destination.cuisine = destination.cuisine.filter(
            cuisine => cuisine._id.toString() !== req.params.cuisineId
        );
        await destination.save();

        res.json({
            success: true,
            message: 'Cuisine deleted successfully'
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Get destination statistics (admin only)
exports.getDestinationStats = async (req, res) => {
    try {
        const stats = await Destination.aggregate([
            {
                $group: {
                    _id: null,
                    totalDestinations: { $sum: 1 },
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: { $size: '$reviews' } },
                    totalHotels: { $sum: { $size: '$hotels' } },
                    totalAttractions: { $sum: { $size: '$attractions' } },
                    totalActivities: { $sum: { $size: '$activities' } },
                    byCountry: {
                        $push: {
                            country: '$country',
                            count: 1
                        }
                    },
                    byRegion: {
                        $push: {
                            region: '$region',
                            count: 1
                        }
                    },
                    byClimate: {
                        $push: {
                            climate: '$climate.type',
                            count: 1
                        }
                    }
                }
            }
        ]);

        res.json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Get popular destinations (admin only)
exports.getPopularDestinations = async (req, res) => {
    try {
        const destinations = await Destination.find({ isActive: true })
            .sort({ popularity: -1, rating: -1 })
            .limit(10)
            .select('name country region rating popularity reviews hotels');

        res.json({
            success: true,
            data: destinations
        });
    } catch (error) {
        handleError(res, error);
    }
}; 