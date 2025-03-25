import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const LocalServicesList = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    minRating: '',
    priceRange: '',
    availability: []
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get('/api/localServices');
      setServices(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch services. Please try again later.');
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !filters.category || service.category === filters.category;
    
    const matchesRating = !filters.minRating || service.rating >= filters.minRating;
    
    const matchesPriceRange = !filters.priceRange || service.priceRange === filters.priceRange;
    
    const matchesAvailability = filters.availability.length === 0 ||
                              filters.availability.every(day => service.availability.includes(day));

    return matchesSearch && matchesCategory && matchesRating && matchesPriceRange && matchesAvailability;
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvailabilityToggle = (day) => {
    setFilters(prev => ({
      ...prev,
      availability: prev.availability.includes(day)
        ? prev.availability.filter(d => d !== day)
        : [...prev.availability, day]
    }));
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search local services..."
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            name="category"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={filters.category}
            onChange={handleFilterChange}
          >
            <option value="">All Categories</option>
            <option value="Cleaning">Cleaning</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Electrical">Electrical</option>
            <option value="Landscaping">Landscaping</option>
            <option value="Moving">Moving</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Min Rating</label>
          <select
            name="minRating"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={filters.minRating}
            onChange={handleFilterChange}
          >
            <option value="">Any Rating</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="2">2+ Stars</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Price Range</label>
          <select
            name="priceRange"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={filters.priceRange}
            onChange={handleFilterChange}
          >
            <option value="">Any Price</option>
            <option value="$">$</option>
            <option value="$$">$$</option>
            <option value="$$$">$$$</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Availability</label>
          <div className="mt-1 space-y-2">
            {['Weekdays', 'Weekends', 'Evenings', 'Emergency'].map(day => (
              <label key={day} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.availability.includes(day)}
                  onChange={() => handleAvailabilityToggle(day)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <span className="ml-2">{day}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map(service => (
          <Link to={`/local-services/${service._id}`} key={service._id}>
            <div className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <img
                src={service.images[0]}
                alt={service.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                <p className="text-gray-600 mb-2">{service.location}</p>
                <div className="flex items-center mb-2">
                  <span className="text-yellow-400">★</span>
                  <span className="ml-1">{service.rating}</span>
                  <span className="ml-2 text-gray-500">{service.priceRange}</span>
                </div>
                <p className="text-sm text-gray-600">{service.category}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {service.availability.map((day, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default LocalServicesList; 