import React, { useState, useEffect, useRef } from 'react';
import { searchService } from '../services';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';

/**
 * Unified search bar component
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.placeholder - Input placeholder text
 * @param {Function} props.onSearch - Callback when search is submitted
 * @returns {JSX.Element} SearchBar component
 */
const SearchBar = ({
  className = '',
  placeholder = 'Search destinations, hotels, flights...',
  onSearch
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  
  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Debounced function to fetch suggestions
  const debouncedFetchSuggestions = useRef(
    debounce(async (searchQuery) => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await searchService.getSearchSuggestions(searchQuery);
        if (response.success) {
          setSuggestions(response.data);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300)
  ).current;
  
  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length >= 2) {
      setIsLoading(true);
      setShowSuggestions(true);
      debouncedFetchSuggestions(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.name);
    setShowSuggestions(false);
    
    // Navigate based on suggestion type
    switch (suggestion.type) {
      case 'city':
        navigate(`/destinations/${suggestion.name.toLowerCase().replace(/\s+/g, '-')}`);
        break;
      case 'hotel':
        navigate(`/hotels/search?query=${encodeURIComponent(suggestion.name)}`);
        break;
      case 'attraction':
        navigate(`/attractions/search?query=${encodeURIComponent(suggestion.name)}`);
        break;
      default:
        handleSearch();
    }
  };
  
  // Handle search submission
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    
    if (query.trim()) {
      setShowSuggestions(false);
      
      if (onSearch) {
        onSearch(query);
      } else {
        navigate(`/search?query=${encodeURIComponent(query)}`);
      }
    }
  };
  
  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <form onSubmit={handleSearch} className="w-full">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-blue-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </form>
      
      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-center text-gray-500">Loading suggestions...</div>
          ) : suggestions.length > 0 ? (
            <ul>
              {suggestions.map((suggestion, index) => (
                <li
                  key={`${suggestion.type}-${suggestion.name}-${index}`}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {/* Icon based on suggestion type */}
                  {suggestion.type === 'city' && (
                    <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )}
                  
                  {suggestion.type === 'hotel' && (
                    <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )}
                  
                  {suggestion.type === 'attraction' && (
                    <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                  )}
                  
                  <div>
                    <span className="block">{suggestion.name}</span>
                    <span className="text-xs text-gray-500 capitalize">{suggestion.type}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            query.length >= 2 && (
              <div className="p-3 text-center text-gray-500">No suggestions found</div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 