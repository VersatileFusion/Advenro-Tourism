const { Flight } = require('../models');

// @desc    Get all flights
// @route   GET /api/v1/flights
// @access  Public
exports.getFlights = async (req, res) => {
    try {
        const {
            departureCity,
            arrivalCity,
            departureDate,
            airline,
            class: flightClass,
            minPrice,
            maxPrice,
            seats,
            page = 1,
            limit = 10
        } = req.query;

        // Build query
        const query = {};
        if (departureCity) query.departureCity = new RegExp(departureCity, 'i');
        if (arrivalCity) query.arrivalCity = new RegExp(arrivalCity, 'i');
        if (departureDate) {
            query.departureDate = {
                $gte: new Date(departureDate),
                $lt: new Date(new Date(departureDate).setDate(new Date(departureDate).getDate() + 1))
            };
        }
        if (airline) query.airline = new RegExp(airline, 'i');
        if (flightClass) query[`price.${flightClass}`] = { $exists: true };
        if (minPrice) query[`price.${flightClass || 'economy'}`] = { $gte: minPrice };
        if (maxPrice) query[`price.${flightClass || 'economy'}`] = { ...query[`price.${flightClass || 'economy'}`], $lte: maxPrice };
        if (seats) query[`availableSeats.${flightClass || 'economy'}`] = { $gte: seats };

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Flight.countDocuments(query);

        const flights = await Flight.find(query)
            .skip(startIndex)
            .limit(limit);

        // Pagination result
        const pagination = {};
        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            };
        }
        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            };
        }

        res.json({
            success: true,
            count: flights.length,
            pagination,
            data: flights
        });
    } catch (error) {
        console.error('Get flights error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get single flight
// @route   GET /api/v1/flights/:id
// @access  Public
exports.getFlight = async (req, res) => {
    try {
        const flight = await Flight.findById(req.params.id);
        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Flight not found'
            });
        }

        res.json({
            success: true,
            data: flight
        });
    } catch (error) {
        console.error('Get flight error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Create new flight
// @route   POST /api/v1/flights
// @access  Private/Admin
exports.createFlight = async (req, res) => {
    try {
        const flight = await Flight.create(req.body);
        res.status(201).json({
            success: true,
            data: flight
        });
    } catch (error) {
        console.error('Create flight error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update flight
// @route   PUT /api/v1/flights/:id
// @access  Private/Admin
exports.updateFlight = async (req, res) => {
    try {
        const flight = await Flight.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Flight not found'
            });
        }

        res.json({
            success: true,
            data: flight
        });
    } catch (error) {
        console.error('Update flight error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Delete flight
// @route   DELETE /api/v1/flights/:id
// @access  Private/Admin
exports.deleteFlight = async (req, res) => {
    try {
        const flight = await Flight.findByIdAndDelete(req.params.id);
        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Flight not found'
            });
        }

        res.json({
            success: true,
            message: 'Flight deleted successfully'
        });
    } catch (error) {
        console.error('Delete flight error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Search flights
// @route   GET /api/v1/flights/search
// @access  Public
exports.searchFlights = async (req, res) => {
    try {
        const { from, to, date, passengers = 1, class: flightClass = 'economy' } = req.query;

        // Validate required parameters
        if (!from || !to || !date) {
            return res.status(400).json({
                success: false,
                message: 'Please provide departure city, arrival city, and date'
            });
        }

        // Build query
        const query = {
            departureCity: new RegExp(from, 'i'),
            arrivalCity: new RegExp(to, 'i'),
            departureDate: {
                $gte: new Date(date),
                $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
            },
            [`availableSeats.${flightClass}`]: { $gte: parseInt(passengers) }
        };

        const flights = await Flight.find(query);

        res.json({
            success: true,
            count: flights.length,
            data: flights
        });
    } catch (error) {
        console.error('Search flights error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
}; 