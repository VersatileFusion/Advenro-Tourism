const { expect } = require('chai');

describe('Destination Model Validation', () => {
  // Mock validator function that mimics Mongoose validation
  const validateDestination = (destination) => {
    const errors = {};
    
    // Required fields
    if (!destination.name) errors.name = 'Destination name is required';
    if (!destination.country) errors.country = 'Country is required';
    if (!destination.description) errors.description = 'Description is required';
    if (!destination.imageUrl) errors.imageUrl = 'Image URL is required';
    
    // Validation rules
    if (destination.name && typeof destination.name !== 'string') {
      errors.name = 'Name must be a string';
    }
    
    if (destination.country && typeof destination.country !== 'string') {
      errors.country = 'Country must be a string';
    }
    
    // Description validation - ensure it's a string with reasonable length
    if (destination.description) {
      if (typeof destination.description !== 'string') {
        errors.description = 'Description must be a string';
      } else if (destination.description.length < 10) {
        errors.description = 'Description should be at least 10 characters';
      }
    }
    
    // Image URL validation - ensure it's a valid URL format
    if (destination.imageUrl) {
      if (typeof destination.imageUrl !== 'string') {
        errors.imageUrl = 'Image URL must be a string';
      } else {
        try {
          new URL(destination.imageUrl);
        } catch (e) {
          errors.imageUrl = 'Image URL must be a valid URL';
        }
      }
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  };
  
  it('should validate a valid destination', () => {
    const validDestination = {
      name: 'Paris',
      country: 'France',
      description: 'The City of Light with beautiful architecture and cuisine',
      imageUrl: 'https://example.com/paris.jpg'
    };
    
    const errors = validateDestination(validDestination);
    expect(errors).to.be.null;
  });
  
  it('should invalidate a destination without required fields', () => {
    const invalidDestination = {
      name: 'Rome',
      country: 'Italy'
      // Missing description and imageUrl
    };
    
    const errors = validateDestination(invalidDestination);
    expect(errors).to.have.property('description', 'Description is required');
    expect(errors).to.have.property('imageUrl', 'Image URL is required');
  });
  
  it('should invalidate a destination with invalid imageUrl', () => {
    const invalidImageDestination = {
      name: 'Barcelona',
      country: 'Spain',
      description: 'A beautiful coastal city with amazing architecture',
      imageUrl: 'not-a-valid-url'
    };
    
    const errors = validateDestination(invalidImageDestination);
    expect(errors).to.have.property('imageUrl', 'Image URL must be a valid URL');
  });
  
  it('should invalidate a destination with short description', () => {
    const shortDescriptionDestination = {
      name: 'Tokyo',
      country: 'Japan',
      description: 'Too short',
      imageUrl: 'https://example.com/tokyo.jpg'
    };
    
    const errors = validateDestination(shortDescriptionDestination);
    expect(errors).to.have.property('description', 'Description should be at least 10 characters');
  });
  
  it('should invalidate a destination with non-string fields', () => {
    const nonStringFieldsDestination = {
      name: 123,
      country: ['Germany'],
      description: 'Berlin is the capital of Germany with rich history',
      imageUrl: 'https://example.com/berlin.jpg'
    };
    
    const errors = validateDestination(nonStringFieldsDestination);
    expect(errors).to.have.property('name', 'Name must be a string');
    expect(errors).to.have.property('country', 'Country must be a string');
  });
}); 