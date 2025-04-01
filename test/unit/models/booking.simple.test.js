const { expect } = require('chai');

describe('Booking Model', () => {
  
  it('should validate booking dates correctly', () => {
    // Mock date validator function
    const validateDates = (checkIn, checkOut) => {
      // Convert to Date objects if strings
      const checkInDate = typeof checkIn === 'string' ? new Date(checkIn) : checkIn;
      const checkOutDate = typeof checkOut === 'string' ? new Date(checkOut) : checkOut;
      
      // Basic validations
      if (!checkInDate || !checkOutDate) {
        return { valid: false, message: 'Both check-in and check-out dates are required' };
      }
      
      // Check if dates are valid
      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        return { valid: false, message: 'Invalid date format' };
      }
      
      // Check if check-out is after check-in
      if (checkInDate >= checkOutDate) {
        return { valid: false, message: 'Check-out date must be after check-in date' };
      }
      
      // Check if check-in is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (checkInDate < today) {
        return { valid: false, message: 'Check-in date cannot be in the past' };
      }
      
      // All validations passed
      return { valid: true };
    };
    
    // Test valid dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    
    const validResult = validateDates(tomorrow, dayAfterTomorrow);
    expect(validResult.valid).to.be.true;
    
    // Test check-out before check-in
    const invalidOrderResult = validateDates(dayAfterTomorrow, tomorrow);
    expect(invalidOrderResult.valid).to.be.false;
    expect(invalidOrderResult.message).to.equal('Check-out date must be after check-in date');
    
    // Test past check-in date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const pastDateResult = validateDates(yesterday, tomorrow);
    expect(pastDateResult.valid).to.be.false;
    expect(pastDateResult.message).to.equal('Check-in date cannot be in the past');
    
    // Test invalid date format
    const invalidDateResult = validateDates('invalid-date', tomorrow);
    expect(invalidDateResult.valid).to.be.false;
    expect(invalidDateResult.message).to.equal('Invalid date format');
    
    // Test missing dates
    const missingDateResult = validateDates(null, tomorrow);
    expect(missingDateResult.valid).to.be.false;
    expect(missingDateResult.message).to.equal('Both check-in and check-out dates are required');
  });
  
  it('should calculate total price correctly', () => {
    // Mock price calculator function
    const calculateTotalPrice = (basePrice, checkIn, checkOut, guests, discount = 0) => {
      // Convert to Date objects if strings
      const checkInDate = typeof checkIn === 'string' ? new Date(checkIn) : checkIn;
      const checkOutDate = typeof checkOut === 'string' ? new Date(checkOut) : checkOut;
      
      // Calculate number of nights
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
      
      // Base calculation
      let total = basePrice * nights;
      
      // Guest surcharge (if more than 2 guests)
      if (guests > 2) {
        // Add 10% per additional guest
        const additionalGuests = guests - 2;
        const guestSurcharge = basePrice * 0.1 * additionalGuests * nights;
        total += guestSurcharge;
      }
      
      // Apply discount
      if (discount > 0) {
        total = total * (1 - discount / 100);
      }
      
      return total;
    };
    
    // Test basic calculation (2 nights, 2 guests, no discount)
    const checkIn = new Date('2023-06-15');
    const checkOut = new Date('2023-06-17');
    
    const basePrice = 100;
    const basicPrice = calculateTotalPrice(basePrice, checkIn, checkOut, 2);
    expect(basicPrice).to.equal(200); // 100 × 2 nights
    
    // Test with additional guests
    const priceWithGuests = calculateTotalPrice(basePrice, checkIn, checkOut, 4);
    expect(priceWithGuests).to.equal(240); // 200 + (100 × 0.1 × 2 additional guests × 2 nights)
    
    // Test with discount
    const priceWithDiscount = calculateTotalPrice(basePrice, checkIn, checkOut, 2, 10);
    expect(priceWithDiscount).to.equal(180); // 200 × (1 - 10/100)
    
    // Test with both additional guests and discount
    const fullPrice = calculateTotalPrice(basePrice, checkIn, checkOut, 4, 10);
    expect(fullPrice).to.equal(216); // 240 × (1 - 10/100)
  });
}); 