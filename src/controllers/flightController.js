const Flight = require('../models/Flight');

// @desc    Get all flights
// @route   GET /api/v1/flights
// @access  Public
exports.getFlights = async (req, res) => {
    try {
        console.log('🔍 Fetching all flights with query:', req.query);
        
        // Build query
        let query = Flight.find();

        // Filter by departure city
        if (req.query.departureCity) {
            console.log(`🌍 Filtering by departure city: ${req.query.departureCity}`);
            query = query.where('departure.city').equals(req.query.departureCity);
        }

        // Filter by arrival city
        if (req.query.arrivalCity) {
            console.log(`🌍 Filtering by arrival city: ${req.query.arrivalCity}`);
            query = query.where('arrival.city').equals(req.query.arrivalCity);
        }

        // Filter by date range
        if (req.query.departureDate) {
            console.log(`📅 Filtering by departure date: ${req.query.departureDate}`);
            const date = new Date(req.query.departureDate);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            
            query = query.where('departure.date').gte(date).lt(nextDay);
        }

        // Filter by price range
        if (req.query.minPrice || req.query.maxPrice) {
            query = query.where('price').gte(req.query.minPrice || 0);
            if (req.query.maxPrice) {
                query = query.where('price').lte(req.query.maxPrice);
            }
        }

        // Filter by airline
        if (req.query.airline) {
            console.log(`✈️ Filtering by airline: ${req.query.airline}`);
            query = query.where('airline').equals(req.query.airline);
        }

        // Filter by class
        if (req.query.class) {
            console.log(`💺 Filtering by class: ${req.query.class}`);
            query = query.where('class').equals(req.query.class);
        }

        // Filter by available seats
        if (req.query.seats) {
            console.log(`👥 Filtering by minimum available seats: ${req.query.seats}`);
            query = query.where('seats.available').gte(req.query.seats);
        }

        // Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('departure.date');
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        query = query.skip(startIndex).limit(limit);

        console.log('📊 Executing flight query...');
        const flights = await query;
        const total = await Flight.countDocuments();

        console.log(`✅ Found ${flights.length} flights`);
        res.status(200).json({
            success: true,
            count: flights.length,
            total,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            data: flights
        });
    } catch (error) {
        console.error('❌ Error fetching flights:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Get single flight
// @route   GET /api/v1/flights/:id
// @access  Public
exports.getFlight = async (req, res) => {
    try {
        console.log(`🔍 Fetching flight with ID: ${req.params.id}`);
        const flight = await Flight.findById(req.params.id);

        if (!flight) {
            console.log('❌ Flight not found');
            return res.status(404).json({
                success: false,
                error: 'Flight not found'
            });
        }

        console.log('✅ Flight found');
        res.status(200).json({
            success: true,
            data: flight
        });
    } catch (error) {
        console.error('❌ Error fetching flight:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Create new flight
// @route   POST /api/v1/flights
// @access  Private/Admin
exports.createFlight = async (req, res) => {
    try {
        console.log('✈️ Creating new flight...');
        console.log('Request body:', req.body);

        const flight = await Flight.create(req.body);

        console.log(`✅ Flight created with ID: ${flight._id}`);
        res.status(201).json({
            success: true,
            data: flight
        });
    } catch (error) {
        console.error('❌ Error creating flight:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Flight number already exists'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Update flight
// @route   PUT /api/v1/flights/:id
// @access  Private/Admin
exports.updateFlight = async (req, res) => {
    try {
        console.log(`🔄 Updating flight with ID: ${req.params.id}`);
        console.log('Update data:', req.body);

        const flight = await Flight.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!flight) {
            console.log('❌ Flight not found');
            return res.status(404).json({
                success: false,
                error: 'Flight not found'
            });
        }

        console.log('✅ Flight updated successfully');
        res.status(200).json({
            success: true,
            data: flight
        });
    } catch (error) {
        console.error('❌ Error updating flight:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Delete flight
// @route   DELETE /api/v1/flights/:id
// @access  Private/Admin
exports.deleteFlight = async (req, res) => {
    try {
        console.log(`🗑️ Deleting flight with ID: ${req.params.id}`);
        
        const flight = await Flight.findById(req.params.id);

        if (!flight) {
            console.log('❌ Flight not found');
            return res.status(404).json({
                success: false,
                error: 'Flight not found'
            });
        }

        await flight.deleteOne();
        console.log('✅ Flight deleted successfully');
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('❌ Error deleting flight:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Search flights
// @route   GET /api/v1/flights/search
// @access  Public
exports.searchFlights = async (req, res) => {
    try {
        console.log('🔍 Searching flights with criteria:', req.query);
        const {
            from,
            to,
            date,
            passengers = 1,
            class: flightClass = 'economy'
        } = req.query;

        if (!from || !to || !date) {
            return res.status(400).json({
                success: false,
                error: 'Please provide departure city, arrival city, and date'
            });
        }

        const searchDate = new Date(date);
        const nextDay = new Date(searchDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const flights = await Flight.find({
            'departure.city': from,
            'arrival.city': to,
            'departure.date': {
                $gte: searchDate,
                $lt: nextDay
            },
            'seats.available': { $gte: parseInt(passengers) },
            class: flightClass
        }).sort('price');

        console.log(`✅ Found ${flights.length} matching flights`);
        res.status(200).json({
            success: true,
            count: flights.length,
            data: flights
        });
    } catch (error) {
        console.error('❌ Error searching flights:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
}; 