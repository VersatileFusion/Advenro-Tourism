describe('Hotel Booking Flow', () => {
  beforeEach(() => {
    // Clear cookies and localStorage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Login before each test
    cy.request('POST', `${Cypress.env('apiUrl')}/auth/register`, {
      firstName: 'Test',
      lastName: 'User',
      email: 'test.booking@example.com',
      password: 'Password123!'
    });
    
    cy.visit('/login');
    cy.get('[data-testid=email]').type('test.booking@example.com');
    cy.get('[data-testid=password]').type('Password123!');
    cy.get('[data-testid=loginButton]').click();
  });

  it('should search for hotels', () => {
    cy.visit('/hotels');
    
    // Fill search form
    cy.get('[data-testid=destination]').type('London');
    cy.get('[data-testid=checkIn]').type('2024-05-01');
    cy.get('[data-testid=checkOut]').type('2024-05-05');
    cy.get('[data-testid=guests]').type('2');
    cy.get('[data-testid=rooms]').type('1');
    
    // Submit search
    cy.get('[data-testid=searchButton]').click();
    
    // Assert search results
    cy.url().should('include', '/search-results');
    cy.get('[data-testid=hotelCard]').should('have.length.at.least', 1);
  });

  it('should view hotel details', () => {
    // First search for hotels
    cy.visit('/hotels');
    cy.get('[data-testid=destination]').type('London');
    cy.get('[data-testid=searchButton]').click();
    
    // Click on first hotel
    cy.get('[data-testid=hotelCard]').first().click();
    
    // Assert hotel details page
    cy.url().should('include', '/hotel-details');
    cy.get('[data-testid=hotelName]').should('be.visible');
    cy.get('[data-testid=hotelDescription]').should('be.visible');
    cy.get('[data-testid=hotelAmenities]').should('be.visible');
  });

  it('should select room and proceed to booking', () => {
    // Navigate to hotel details
    cy.visit('/hotel-details/123'); // Replace with actual hotel ID
    
    // Select dates
    cy.get('[data-testid=checkIn]').type('2024-05-01');
    cy.get('[data-testid=checkOut]').type('2024-05-05');
    
    // Select room
    cy.get('[data-testid=roomType]').first().click();
    cy.get('[data-testid=selectRoomButton]').click();
    
    // Assert booking page
    cy.url().should('include', '/booking');
    cy.get('[data-testid=bookingSummary]').should('be.visible');
  });

  it('should complete booking process', () => {
    // Navigate to booking page
    cy.visit('/booking');
    
    // Fill booking details
    cy.get('[data-testid=firstName]').type('John');
    cy.get('[data-testid=lastName]').type('Doe');
    cy.get('[data-testid=email]').type('john.doe@example.com');
    cy.get('[data-testid=phone]').type('1234567890');
    
    // Fill payment details
    cy.get('[data-testid=cardNumber]').type('4111111111111111');
    cy.get('[data-testid=expiryDate]').type('1225');
    cy.get('[data-testid=cvv]').type('123');
    
    // Complete booking
    cy.get('[data-testid=completeBookingButton]').click();
    
    // Assert booking confirmation
    cy.url().should('include', '/booking-confirmation');
    cy.get('[data-testid=bookingSuccess]').should('be.visible');
  });

  it('should handle booking errors gracefully', () => {
    // Navigate to booking page
    cy.visit('/booking');
    
    // Try to complete booking without required fields
    cy.get('[data-testid=completeBookingButton]').click();
    
    // Assert error messages
    cy.get('[data-testid=errorMessage]').should('be.visible');
    cy.get('[data-testid=firstNameError]').should('contain', 'Required');
    cy.get('[data-testid=lastNameError]').should('contain', 'Required');
    cy.get('[data-testid=emailError]').should('contain', 'Required');
  });
}); 