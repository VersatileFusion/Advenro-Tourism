const Flight = require('../models/flight');
const Airport = require('../models/airport');

// Search airports
exports.searchAirports = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.status(400).json({ message: 'Search query must be at least 2 characters long' });
        }

        const airports = await Airport.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { code: { $regex: q, $options: 'i' } }
            ]
        }).limit(10);

        res.json(airports);
    } catch (error) {
        console.error('Error searching airports:', error);
        res.status(500).json({ message: 'Error searching airports' });
    }
};

// Search flights
exports.searchFlights = async (req, res) => {
    try {
        const { from, to, departure, return: returnDate, passengers } = req.body;

        // Validate required fields
        if (!from || !to || !departure) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Find flights matching criteria
        const flights = await Flight.find({
            'departure.airport.code': from,
            'arrival.airport.code': to,
            'departure.date': {
                $gte: new Date(departure),
                $lt: new Date(new Date(departure).setDate(new Date(departure).getDate() + 1))
            },
            availableSeats: { $gte: parseInt(passengers) }
        }).populate('departure.airport arrival.airport airline');

        // Format flight results
        const formattedFlights = flights.map(flight => ({
            id: flight._id,
            airline: flight.airline.name,
            airlineLogo: flight.airline.logo,
            departureTime: flight.departure.time,
            arrivalTime: flight.arrival.time,
            duration: flight.duration,
            stops: flight.stops,
            price: flight.price,
            departureAirport: flight.departure.airport.name,
            arrivalAirport: flight.arrival.airport.name
        }));

        res.json(formattedFlights);
    } catch (error) {
        console.error('Error searching flights:', error);
        res.status(500).json({ message: 'Error searching flights' });
    }
};

// Get flight details
exports.getFlightDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const flight = await Flight.findById(id)
            .populate('departure.airport arrival.airport airline');

        if (!flight) {
            return res.status(404).json({ message: 'Flight not found' });
        }

        res.json(flight);
    } catch (error) {
        console.error('Error getting flight details:', error);
        res.status(500).json({ message: 'Error getting flight details' });
    }
};

// Book flight
exports.bookFlight = async (req, res) => {
    try {
        const { flightId, passengers, contactInfo } = req.body;
        const flight = await Flight.findById(flightId);

        if (!flight) {
            return res.status(404).json({ message: 'Flight not found' });
        }

        if (flight.availableSeats < passengers.length) {
            return res.status(400).json({ message: 'Not enough seats available' });
        }

        // Create booking
        const booking = await Booking.create({
            flight: flightId,
            passengers,
            contactInfo,
            status: 'confirmed',
            totalPrice: flight.price * passengers.length
        });

        // Update available seats
        flight.availableSeats -= passengers.length;
        await flight.save();

        res.status(201).json(booking);
    } catch (error) {
        console.error('Error booking flight:', error);
        res.status(500).json({ message: 'Error booking flight' });
    }
};

// Get user's flight bookings
exports.getUserBookings = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming user info is added by auth middleware
        const bookings = await Booking.find({ 'contactInfo.userId': userId })
            .populate('flight')
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (error) {
        console.error('Error getting user bookings:', error);
        res.status(500).json({ message: 'Error getting user bookings' });
    }
}; 