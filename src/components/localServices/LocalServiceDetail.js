import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const LocalServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    serviceType: '',
    description: '',
    address: ''
  });
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchServiceDetails();
  }, [id]);

  const fetchServiceDetails = async () => {
    try {
      const response = await axios.get(`/api/localServices/${id}`);
      setService(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch service details. Please try again later.');
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
      const response = await axios.post(`/api/localServices/${id}/book`, bookingData, {
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
  if (!service) return <div className="text-center py-8">Service not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="relative">
            <img
              src={service.images[selectedImage]}
              alt={service.name}
              className="w-full h-96 object-cover rounded-lg"
            />
            <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-2">
              {service.images.map((_, index) => (
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
            <h1 className="text-3xl font-bold mb-4">{service.name}</h1>
            <div className="flex items-center mb-4">
              <span className="text-yellow-400">★</span>
              <span className="ml-1">{service.rating}</span>
              <span className="ml-4 text-gray-600">{service.reviewCount} reviews</span>
            </div>
            <p className="text-gray-600 mb-4">{service.location}</p>
            <div className="prose max-w-none">
              <p>{service.description}</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Service Types</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {service.serviceTypes.map((type, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-2">{type.name}</h3>
                  <p className="text-gray-600 mb-2">{type.description}</p>
                  <p className="text-indigo-600 font-semibold">Starting from ${type.price}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Availability</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {service.availability.map((day, index) => (
                <div key={index} className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>{day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
            <div className="space-y-4">
              {service.reviews.map((review, index) => (
                <div key={index} className="border-b pb-4">
                  <div className="flex items-center mb-2">
                    <span className="text-yellow-400">★</span>
                    <span className="ml-1">{review.rating}</span>
                    <span className="ml-2 text-gray-500">{review.date}</span>
                  </div>
                  <p className="text-gray-600">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Book Service</h2>
            <form onSubmit={handleBookingSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Service Type</label>
                  <select
                    name="serviceType"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={bookingData.serviceType}
                    onChange={handleBookingChange}
                  >
                    <option value="">Select a service type</option>
                    {service.serviceTypes.map((type, index) => (
                      <option key={index} value={type.name}>
                        {type.name} - ${type.price}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    name="date"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={bookingData.date}
                    onChange={handleBookingChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <input
                    type="time"
                    name="time"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={bookingData.time}
                    onChange={handleBookingChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Service Address</label>
                  <textarea
                    name="address"
                    rows="3"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={bookingData.address}
                    onChange={handleBookingChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Additional Details</label>
                  <textarea
                    name="description"
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={bookingData.description}
                    onChange={handleBookingChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Book Service
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalServiceDetail; 