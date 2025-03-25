describe('Flight Booking Flow', () => {
  beforeEach(() => {
    // Clear cookies and localStorage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Login before each test
    cy.request('POST', `${Cypress.env('apiUrl')}/auth/register`, {
      firstName: 'Test',
      lastName: 'User',
      email: 'test.flight@example.com',
      password: 'Password123!'
    });
    
    cy.visit('/login');
    cy.get('[data-testid=email]').type('test.flight@example.com');
    cy.get('[data-testid=password]').type('Password123!');
    cy.get('[data-testid=loginButton]').click();
  });

  it('should search for flights', () => {
    cy.visit('/flights');
    
    // Fill search form
    cy.get('[data-testid=from]').type('London');
    cy.get('[data-testid=to]').type('New York');
    cy.get('[data-testid=departureDate]').type('2024-05-01');
    cy.get('[data-testid=returnDate]').type('2024-05-05');
    cy.get('[data-testid=passengers]').type('1');
    cy.get('[data-testid=class]').select('Economy');
    
    // Submit search
    cy.get('[data-testid=searchButton]').click();
    
    // Assert search results
    cy.url().should('include', '/flight-results');
    cy.get('[data-testid=flightCard]').should('have.length.at.least', 1);
  });

  it('should select flight and proceed to seat selection', () => {
    // First search for flights
    cy.visit('/flights');
    cy.get('[data-testid=from]').type('London');
    cy.get('[data-testid=to]').type('New York');
    cy.get('[data-testid=searchButton]').click();
    
    // Select first flight
    cy.get('[data-testid=flightCard]').first().click();
    
    // Assert seat selection page
    cy.url().should('include', '/seat-selection');
    cy.get('[data-testid=seatMap]').should('be.visible');
  });

  it('should select seats and proceed to payment', () => {
    // Navigate to seat selection
    cy.visit('/seat-selection');
    
    // Select seats
    cy.get('[data-testid=seat-1A]').click();
    cy.get('[data-testid=confirmSeatsButton]').click();
    
    // Assert payment page
    cy.url().should('include', '/payment');
    cy.get('[data-testid=paymentForm]').should('be.visible');
  });

  it('should complete flight booking process', () => {
    // Navigate to payment page
    cy.visit('/payment');
    
    // Fill passenger details
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
    cy.url().should('include', '/boarding-pass');
    cy.get('[data-testid=boardingPass]').should('be.visible');
  });

  it('should handle booking errors gracefully', () => {
    // Navigate to payment page
    cy.visit('/payment');
    
    // Try to complete booking without required fields
    cy.get('[data-testid=completeBookingButton]').click();
    
    // Assert error messages
    cy.get('[data-testid=errorMessage]').should('be.visible');
    cy.get('[data-testid=firstNameError]').should('contain', 'Required');
    cy.get('[data-testid=lastNameError]').should('contain', 'Required');
    cy.get('[data-testid=emailError]').should('contain', 'Required');
  });

  it('should validate flight dates', () => {
    cy.visit('/flights');
    
    // Try to search with invalid dates
    cy.get('[data-testid=from]').type('London');
    cy.get('[data-testid=to]').type('New York');
    cy.get('[data-testid=departureDate]').type('2023-01-01'); // Past date
    cy.get('[data-testid=returnDate]').type('2023-01-05'); // Past date
    cy.get('[data-testid=searchButton]').click();
    
    // Assert error message
    cy.get('[data-testid=dateError]').should('contain', 'Please select future dates');
  });
}); 