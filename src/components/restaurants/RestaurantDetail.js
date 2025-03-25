import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reservationData, setReservationData] = useState({
    date: '',
    time: '',
    guests: 1,
    specialRequests: ''
  });
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchRestaurantDetails();
  }, [id]);

  const fetchRestaurantDetails = async () => {
    try {
      const response = await axios.get(`/api/restaurants/${id}`);
      setRestaurant(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch restaurant details. Please try again later.');
      setLoading(false);
    }
  };

  const handleReservationChange = (e) => {
    const { name, value } = e.target;
    setReservationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`/api/restaurants/${id}/reserve`, reservationData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      navigate(`/reservations/${response.data.reservationId}`);
    } catch (err) {
      setError('Failed to create reservation. Please try again.');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;
  if (!restaurant) return <div className="text-center py-8">Restaurant not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="relative">
            <img
              src={restaurant.images[selectedImage]}
              alt={restaurant.name}
              className="w-full h-96 object-cover rounded-lg"
            />
            <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-2">
              {restaurant.images.map((_, index) => (
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
            <h1 className="text-3xl font-bold mb-4">{restaurant.name}</h1>
            <div className="flex items-center mb-4">
              <span className="text-yellow-400">★</span>
              <span className="ml-1">{restaurant.rating}</span>
              <span className="ml-4 text-gray-600">{restaurant.reviewCount} reviews</span>
            </div>
            <p className="text-gray-600 mb-4">{restaurant.location}</p>
            <div className="prose max-w-none">
              <p>{restaurant.description}</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Menu</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {restaurant.menu.map((category, index) => (
                <div key={index}>
                  <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                  <ul className="space-y-2">
                    {category.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        <span className="text-indigo-600">${item.price}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Features</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {restaurant.features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Make a Reservation</h2>
            <form onSubmit={handleReservationSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    name="date"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={reservationData.date}
                    onChange={handleReservationChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <input
                    type="time"
                    name="time"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={reservationData.time}
                    onChange={handleReservationChange}
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
                    value={reservationData.guests}
                    onChange={handleReservationChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Special Requests</label>
                  <textarea
                    name="specialRequests"
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={reservationData.specialRequests}
                    onChange={handleReservationChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Reserve Table
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetail; 