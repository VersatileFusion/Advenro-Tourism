const { expect } = require('chai');

describe('Hotel Schema Validation', () => {
  it('should validate hotel properties correctly', () => {
    // Create a mock hotel schema validator
    const validateHotel = (hotel) => {
      const errors = {};
      
      // Required fields
      if (!hotel.name) errors.name = 'Hotel name is required';
      if (!hotel.location) errors.location = 'Location is required';
      if (!hotel.description) errors.description = 'Description is required';
      if (!hotel.pricePerNight) errors.pricePerNight = 'Price per night is required';
      
      // Validation rules
      if (hotel.pricePerNight && hotel.pricePerNight <= 0) {
        errors.pricePerNight = 'Price must be greater than 0';
      }
      
      if (hotel.rating && (hotel.rating < 1 || hotel.rating > 5)) {
        errors.rating = 'Rating must be between 1 and 5';
      }
      
      return Object.keys(errors).length > 0 ? errors : null;
    };
    
    // Test valid hotel
    const validHotel = {
      name: 'Grand Hotel',
      location: 'Paris, France',
      description: 'Luxury hotel in the heart of Paris',
      pricePerNight: 250,
      rating: 4.5
    };
    expect(validateHotel(validHotel)).to.be.null;
    
    // Test missing required fields
    const missingFields = { rating: 4 };
    const missingFieldsErrors = validateHotel(missingFields);
    expect(missingFieldsErrors).to.have.property('name');
    expect(missingFieldsErrors).to.have.property('location');
    expect(missingFieldsErrors).to.have.property('description');
    expect(missingFieldsErrors).to.have.property('pricePerNight');
    
    // Test invalid price
    const invalidPrice = {
      name: 'Budget Hotel',
      location: 'London, UK',
      description: 'Affordable accommodation',
      pricePerNight: 0,
      rating: 3
    };
    const priceErrors = validateHotel(invalidPrice);
    expect(priceErrors).to.have.property('pricePerNight');
    
    // Test invalid rating
    const invalidRating = {
      name: 'Seaside Resort',
      location: 'Miami, USA',
      description: 'Beach resort with ocean views',
      pricePerNight: 350,
      rating: 6
    };
    const ratingErrors = validateHotel(invalidRating);
    expect(ratingErrors).to.have.property('rating');
  });
}); 