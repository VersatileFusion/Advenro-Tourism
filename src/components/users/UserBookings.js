import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await axios.get('/api/users/bookings', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setBookings(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch bookings. Please try again later.');
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await axios.post(`/api/bookings/${bookingId}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchBookings();
    } catch (err) {
      setError('Failed to cancel booking. Please try again.');
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const now = new Date();
    const bookingDate = new Date(booking.date);
    
    switch (filter) {
      case 'upcoming':
        return bookingDate > now && booking.status !== 'cancelled';
      case 'past':
        return bookingDate < now && booking.status !== 'cancelled';
      case 'cancelled':
        return booking.status === 'cancelled';
      default:
        return true;
    }
  });

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

        <div className="mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-md ${
                filter === 'upcoming'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`px-4 py-2 rounded-md ${
                filter === 'past'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Past
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2 rounded-md ${
                filter === 'cancelled'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No bookings found for this filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map(booking => (
              <div
                key={booking._id}
                className="bg-white rounded-lg shadow-lg p-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">
                      {booking.serviceType === 'hotel' ? 'Hotel Booking' :
                       booking.serviceType === 'restaurant' ? 'Restaurant Reservation' :
                       'Local Service'}
                    </h2>
                    <p className="text-gray-600 mb-2">
                      {booking.serviceName}
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">
                        Date: {new Date(booking.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Time: {new Date(booking.date).toLocaleTimeString()}
                      </p>
                      {booking.guests && (
                        <p className="text-sm text-gray-500">
                          Guests: {booking.guests}
                        </p>
                      )}
                      {booking.rooms && (
                        <p className="text-sm text-gray-500">
                          Rooms: {booking.rooms}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                    {booking.status === 'confirmed' && new Date(booking.date) > new Date() && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        className="mt-2 block w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>

                {booking.specialRequests && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-gray-700">Special Requests</h3>
                    <p className="text-sm text-gray-600">{booking.specialRequests}</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Total Amount</span>
                    <span className="text-lg font-semibold">${booking.totalAmount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserBookings; 