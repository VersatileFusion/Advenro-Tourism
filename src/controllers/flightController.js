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

// @desc    Get seats for a specific flight
// @route   GET /api/v1/flights/:id/seats
// @access  Public
exports.getFlightSeats = async (req, res) => {
    try {
        const { id } = req.params;
        const { cabinClass = 'economy' } = req.query;
        
        const flight = await Flight.findById(id);
        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Flight not found'
            });
        }
        
        // In a real implementation, you would fetch actual seat data from a database
        // For demonstration, we'll generate mock seat data
        const rows = cabinClass === 'economy' ? 30 : (cabinClass === 'business' ? 10 : 5);
        const seatsPerRow = cabinClass === 'economy' ? 6 : (cabinClass === 'business' ? 4 : 2); // A-F economy, A-D business, A-B first
        const seats = [];
        
        // Generate seat map
        for (let row = 1; row <= rows; row++) {
            for (let seatNum = 0; seatNum < seatsPerRow; seatNum++) {
                const seatLetter = String.fromCharCode(65 + seatNum); // A, B, C, etc.
                const seatId = `${row}${seatLetter}`;
                
                // Randomly mark some seats as unavailable or reserved
                const randomStatus = Math.random();
                let status = 'available';
                
                if (randomStatus < 0.3) {
                    status = 'reserved';
                } else if (randomStatus < 0.4) {
                    status = 'unavailable';
                }
                
                // Calculate seat price based on cabin class and position
                let price = 0;
                switch (cabinClass) {
                    case 'economy':
                        price = 50 + (row < 10 ? 20 : 0) + (seatLetter === 'A' || seatLetter === 'F' ? 10 : 0);
                        break;
                    case 'business':
                        price = 150 + (row < 5 ? 50 : 0);
                        break;
                    case 'first':
                        price = 300 + (row < 3 ? 100 : 0);
                        break;
                }
                
                seats.push({
                    id: seatId,
                    row: row,
                    column: seatLetter,
                    type: cabinClass,
                    status: status,
                    price: price,
                    features: []
                });
            }
        }
        
        res.json({
            success: true,
            data: {
                flightId: id,
                cabinClass,
                seats
            }
        });
    } catch (error) {
        console.error('Get flight seats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Reserve a seat on a flight
// @route   POST /api/v1/flights/:id/seats/:seatId/reserve
// @access  Private
exports.reserveSeat = async (req, res) => {
    try {
        const { id, seatId } = req.params;
        const userId = req.user ? req.user.id : 'guest-user'; // In a real app, this would come from auth middleware
        
        const flight = await Flight.findById(id);
        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Flight not found'
            });
        }
        
        // In a real implementation, you would:
        // 1. Check if the seat exists and is available
        // 2. Update the seat status in the database
        // 3. Create a seat reservation record
        
        // For demonstration, we'll just return success
        
        // Randomly fail 10% of the time to demonstrate error handling
        if (Math.random() < 0.1) {
            return res.status(400).json({
                success: false,
                message: 'Seat is no longer available'
            });
        }
        
        res.json({
            success: true,
            data: {
                flightId: id,
                seatId,
                status: 'reserved',
                userId,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Reserve seat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Release a reserved seat
// @route   POST /api/v1/flights/:id/seats/:seatId/release
// @access  Private
exports.releaseSeat = async (req, res) => {
    try {
        const { id, seatId } = req.params;
        const userId = req.user ? req.user.id : 'guest-user'; // In a real app, this would come from auth middleware
        
        const flight = await Flight.findById(id);
        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Flight not found'
            });
        }
        
        // In a real implementation, you would:
        // 1. Check if the seat exists and is reserved by this user
        // 2. Update the seat status in the database
        
        // For demonstration, we'll just return success
        
        res.json({
            success: true,
            data: {
                flightId: id,
                seatId,
                status: 'available',
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Release seat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
}; 