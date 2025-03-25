const Tour = require('../models/tour');
const Destination = require('../models/destination');

// Search destinations
exports.searchDestinations = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.status(400).json({ message: 'Search query must be at least 2 characters long' });
        }

        const destinations = await Destination.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { country: { $regex: q, $options: 'i' } },
                { region: { $regex: q, $options: 'i' } }
            ]
        }).limit(10);

        res.json(destinations);
    } catch (error) {
        console.error('Error searching destinations:', error);
        res.status(500).json({ message: 'Error searching destinations' });
    }
};

// Search tours
exports.searchTours = async (req, res) => {
    try {
        const {
            destination,
            startDate,
            duration,
            guests,
            priceRange,
            tourTypes,
            activities
        } = req.body;

        // Build query
        const query = {};

        // Destination filter
        if (destination) {
            const dest = await Destination.findOne({
                $or: [
                    { name: { $regex: destination, $options: 'i' } },
                    { country: { $regex: destination, $options: 'i' } }
                ]
            });
            if (dest) {
                query.destination = dest._id;
            }
        }

        // Date filter
        if (startDate) {
            query['startDates.date'] = {
                $gte: new Date(startDate),
                $lt: new Date(new Date(startDate).setDate(new Date(startDate).getDate() + 30))
            };
        }

        // Duration filter
        if (duration) {
            const [min, max] = duration.split('-').map(Number);
            query.duration = {
                $gte: min,
                $lte: max
            };
        }

        // Group size filter
        if (guests) {
            query.maxGroupSize = { $gte: guests };
        }

        // Price range filter
        if (priceRange) {
            switch (priceRange) {
                case 'budget':
                    query.price = { $lte: 1000 };
                    break;
                case 'moderate':
                    query.price = { $gt: 1000, $lte: 3000 };
                    break;
                case 'luxury':
                    query.price = { $gt: 3000 };
                    break;
            }
        }

        // Tour type filter
        if (tourTypes && tourTypes.length > 0) {
            query.tourType = { $in: tourTypes };
        }

        // Activities filter
        if (activities && activities.length > 0) {
            query.activities = { $in: activities };
        }

        // Find tours
        const tours = await Tour.find(query)
            .populate('destination', 'name country')
            .populate('guides', 'name photo')
            .sort({ ratingsAverage: -1 });

        res.json(tours);
    } catch (error) {
        console.error('Error searching tours:', error);
        res.status(500).json({ message: 'Error searching tours' });
    }
};

// Get tour details
exports.getTourDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const tour = await Tour.findById(id)
            .populate('destination')
            .populate('guides')
            .populate({
                path: 'reviews',
                select: 'rating review user'
            });

        if (!tour) {
            return res.status(404).json({ message: 'Tour not found' });
        }

        res.json(tour);
    } catch (error) {
        console.error('Error getting tour details:', error);
        res.status(500).json({ message: 'Error getting tour details' });
    }
};

// Book tour
exports.bookTour = async (req, res) => {
    try {
        const { tourId, startDate, participants, contactInfo } = req.body;
        const tour = await Tour.findById(tourId);

        if (!tour) {
            return res.status(404).json({ message: 'Tour not found' });
        }

        // Check if start date exists and has available spots
        const startDateObj = new Date(startDate);
        const tourDate = tour.startDates.find(
            date => date.date.toISOString().split('T')[0] === startDateObj.toISOString().split('T')[0]
        );

        if (!tourDate) {
            return res.status(400).json({ message: 'Tour not available on selected date' });
        }

        if (tourDate.participants + participants > tour.maxGroupSize) {
            return res.status(400).json({ message: 'Not enough spots available' });
        }

        // Create booking
        const booking = await Booking.create({
            tour: tourId,
            startDate: startDateObj,
            participants,
            contactInfo,
            status: 'pending',
            totalPrice: tour.price * participants
        });

        // Update participants count
        tourDate.participants += participants;
        await tour.save();

        res.status(201).json(booking);
    } catch (error) {
        console.error('Error booking tour:', error);
        res.status(500).json({ message: 'Error booking tour' });
    }
};

// Get user's tour bookings
exports.getUserBookings = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming user info is added by auth middleware
        const bookings = await Booking.find({ 'contactInfo.userId': userId })
            .populate('tour')
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (error) {
        console.error('Error getting user bookings:', error);
        res.status(500).json({ message: 'Error getting user bookings' });
    }
}; 