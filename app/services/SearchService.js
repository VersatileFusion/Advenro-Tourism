import { apiClient } from './apiClient';

/**
 * SearchService class handles all search-related API calls
 */
class SearchService {
  /**
   * Perform a unified search across all entity types
   * @param {Object} params - Search parameters
   * @param {string} params.query - Search query
   * @param {string} params.location - Location filter
   * @param {string} params.types - Comma-separated list of entity types to search
   * @param {number} params.limit - Maximum number of results per type
   * @returns {Promise<Object>} Search results grouped by entity type
   */
  async unifiedSearch({ query, location, types, limit }) {
    const queryParams = new URLSearchParams();
    
    if (query) queryParams.append('query', query);
    if (location) queryParams.append('location', location);
    if (types) queryParams.append('types', types);
    if (limit) queryParams.append('limit', limit);
    
    const { data } = await apiClient.get(`/api/search?${queryParams.toString()}`);
    return data;
  }
  
  /**
   * Get trending destinations and popular searches
   * @returns {Promise<Object>} Trending data including destinations and popular search terms
   */
  async getTrending() {
    const { data } = await apiClient.get('/api/search/trending');
    return data;
  }
  
  /**
   * Get search suggestions as user types
   * @param {string} query - Current search query
   * @returns {Promise<Object>} Suggestion data
   */
  async getSearchSuggestions(query) {
    if (!query || query.length < 2) {
      return { success: true, data: [] };
    }
    
    const queryParams = new URLSearchParams();
    queryParams.append('query', query);
    
    const { data } = await apiClient.get(`/api/search/suggestions?${queryParams.toString()}`);
    return data;
  }
  
  /**
   * Search hotels only
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} Hotel search results
   */
  async searchHotels(params) {
    return this.unifiedSearch({ ...params, types: 'hotels' });
  }
  
  /**
   * Search restaurants only
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} Restaurant search results
   */
  async searchRestaurants(params) {
    return this.unifiedSearch({ ...params, types: 'restaurants' });
  }
  
  /**
   * Search flights only
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} Flight search results
   */
  async searchFlights(params) {
    return this.unifiedSearch({ ...params, types: 'flights' });
  }
  
  /**
   * Search tours only
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} Tour search results
   */
  async searchTours(params) {
    return this.unifiedSearch({ ...params, types: 'tours' });
  }
  
  /**
   * Search events only
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} Event search results
   */
  async searchEvents(params) {
    return this.unifiedSearch({ ...params, types: 'events' });
  }
}

export const searchService = new SearchService(); 