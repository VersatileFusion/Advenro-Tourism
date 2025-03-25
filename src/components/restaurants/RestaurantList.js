import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const RestaurantList = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    cuisine: '',
    minRating: '',
    priceRange: '',
    features: []
  });

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await axios.get('/api/restaurants');
      setRestaurants(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch restaurants. Please try again later.');
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCuisine = !filters.cuisine || restaurant.cuisine === filters.cuisine;
    
    const matchesRating = !filters.minRating || restaurant.rating >= filters.minRating;
    
    const matchesPriceRange = !filters.priceRange || restaurant.priceRange === filters.priceRange;
    
    const matchesFeatures = filters.features.length === 0 ||
                          filters.features.every(feature => restaurant.features.includes(feature));

    return matchesSearch && matchesCuisine && matchesRating && matchesPriceRange && matchesFeatures;
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFeatureToggle = (feature) => {
    setFilters(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search restaurants..."
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700">Cuisine Type</label>
          <select
            name="cuisine"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={filters.cuisine}
            onChange={handleFilterChange}
          >
            <option value="">All Cuisines</option>
            <option value="Italian">Italian</option>
            <option value="Japanese">Japanese</option>
            <option value="Mexican">Mexican</option>
            <option value="Indian">Indian</option>
            <option value="Chinese">Chinese</option>
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
            <option value="$$$$">$$$$</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Features</label>
          <div className="mt-1 space-y-2">
            {['Delivery', 'Takeout', 'Reservations', 'Outdoor Seating', 'Parking'].map(feature => (
              <label key={feature} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.features.includes(feature)}
                  onChange={() => handleFeatureToggle(feature)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <span className="ml-2">{feature}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRestaurants.map(restaurant => (
          <Link to={`/restaurants/${restaurant._id}`} key={restaurant._id}>
            <div className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <img
                src={restaurant.images[0]}
                alt={restaurant.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{restaurant.name}</h3>
                <p className="text-gray-600 mb-2">{restaurant.location}</p>
                <div className="flex items-center mb-2">
                  <span className="text-yellow-400">★</span>
                  <span className="ml-1">{restaurant.rating}</span>
                  <span className="ml-2 text-gray-500">{restaurant.priceRange}</span>
                </div>
                <p className="text-sm text-gray-600">{restaurant.cuisine}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RestaurantList; 