const axios = require('axios');

/**
 * Geocode an address using a geocoding service
 * @param {string} address - Address to geocode
 * @returns {Promise<{lat: number, lng: number}>} Geocoded coordinates
 */
const geocodeAddress = async (address) => {
    try {
        // Using OpenStreetMap Nominatim API (free and no API key required)
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: address,
                format: 'json',
                limit: 1
            },
            headers: {
                'User-Agent': 'TourismPlatform/1.0' // Required by Nominatim's terms of service
            }
        });

        if (response.data && response.data.length > 0) {
            return {
                lat: parseFloat(response.data[0].lat),
                lng: parseFloat(response.data[0].lon)
            };
        }

        throw new Error('Address not found');
    } catch (error) {
        console.error('Geocoding error:', error);
        throw new Error('Failed to geocode address');
    }
};

/**
 * Calculate distance between two points using the Haversine formula
 * @param {number} lat1 - First point latitude
 * @param {number} lon1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lon2 - Second point longitude
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
const toRad = (degrees) => {
    return degrees * (Math.PI / 180);
};

module.exports = {
    geocodeAddress,
    calculateDistance
}; 