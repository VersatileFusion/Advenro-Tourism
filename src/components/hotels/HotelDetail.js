import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const HotelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    rooms: 1
  });
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchHotelDetails();
  }, [id]);

  const fetchHotelDetails = async () => {
    try {
      const response = await axios.get(`/api/hotels/${id}`);
      setHotel(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch hotel details. Please try again later.');
      setLoading(false);
    }
  };

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`/api/hotels/${id}/book`, bookingData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      navigate(`/bookings/${response.data.bookingId}`);
    } catch (err) {
      setError('Failed to create booking. Please try again.');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;
  if (!hotel) return <div className="text-center py-8">Hotel not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="relative">
            <img
              src={hotel.images[selectedImage]}
              alt={hotel.name}
              className="w-full h-96 object-cover rounded-lg"
            />
            <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-2">
              {hotel.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-3 h-3 rounded-full ${
                    selectedImage === index ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h1 className="text-3xl font-bold mb-4">{hotel.name}</h1>
            <div className="flex items-center mb-4">
              <span className="text-yellow-400">★</span>
              <span className="ml-1">{hotel.rating}</span>
              <span className="ml-4 text-gray-600">{hotel.reviewCount} reviews</span>
            </div>
            <p className="text-gray-600 mb-4">{hotel.location}</p>
            <div className="prose max-w-none">
              <p>{hotel.description}</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {hotel.amenities.map((amenity, index) => (
                <div key={index} className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Book Now</h2>
            <form onSubmit={handleBookingSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Check-in Date</label>
                  <input
                    type="date"
                    name="checkIn"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={bookingData.checkIn}
                    onChange={handleBookingChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Check-out Date</label>
                  <input
                    type="date"
                    name="checkOut"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={bookingData.checkOut}
                    onChange={handleBookingChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Number of Guests</label>
                  <input
                    type="number"
                    name="guests"
                    min="1"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={bookingData.guests}
                    onChange={handleBookingChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Number of Rooms</label>
                  <input
                    type="number"
                    name="rooms"
                    min="1"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={bookingData.rooms}
                    onChange={handleBookingChange}
                  />
                </div>
              </div>

              <div className="mt-6">
                <p className="text-2xl font-bold text-indigo-600">
                  ${hotel.price * bookingData.rooms} total
                </p>
                <p className="text-sm text-gray-500">for {bookingData.rooms} room(s)</p>
              </div>

              <button
                type="submit"
                className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Book Now
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetail; 