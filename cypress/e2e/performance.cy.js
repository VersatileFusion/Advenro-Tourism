describe('Performance Tests', () => {
  beforeEach(() => {
    // Clear cookies and localStorage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Enable performance metrics
    cy.intercept('**/*').as('allRequests');
  });

  it('should load home page within performance budget', () => {
    cy.visit('/');
    
    // Check page load time
    cy.window().then((win) => {
      const performance = win.performance;
      const navigation = performance.getEntriesByType('navigation')[0];
      expect(navigation.loadEventEnd - navigation.navigationStart).to.be.lessThan(3000);
    });
    
    // Check resource loading
    cy.get('@allRequests').then((interceptions) => {
      interceptions.forEach((interception) => {
        expect(interception.response.statusCode).to.be.lessThan(400);
      });
    });
  });

  it('should handle image optimization', () => {
    cy.visit('/hotels');
    
    // Check image loading
    cy.get('img').each(($img) => {
      cy.wrap($img).should('have.attr', 'loading', 'lazy');
      cy.wrap($img).should('have.attr', 'srcset');
    });
  });

  it('should handle API response times', () => {
    cy.visit('/hotels');
    
    // Intercept API calls
    cy.intercept('GET', '**/api/hotels**').as('hotelSearch');
    
    // Perform search
    cy.get('[data-testid=destination]').type('London');
    cy.get('[data-testid=searchButton]').click();
    
    // Check API response time
    cy.wait('@hotelSearch').then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
      expect(interception.response.duration).to.be.lessThan(1000);
    });
  });

  it('should handle client-side routing performance', () => {
    cy.visit('/');
    
    // Measure navigation time
    const startTime = performance.now();
    
    // Navigate to hotels page
    cy.get('[data-testid=hotelsLink]').click();
    
    cy.url().should('include', '/hotels').then(() => {
      const endTime = performance.now();
      expect(endTime - startTime).to.be.lessThan(500);
    });
  });

  it('should handle form submission performance', () => {
    cy.visit('/signup');
    
    // Fill form
    cy.get('[data-testid=firstName]').type('John');
    cy.get('[data-testid=lastName]').type('Doe');
    cy.get('[data-testid=email]').type('john@example.com');
    cy.get('[data-testid=password]').type('Password123!');
    
    // Measure form submission time
    const startTime = performance.now();
    
    // Submit form
    cy.get('[data-testid=signupForm]').submit();
    
    cy.url().should('include', '/dashboard').then(() => {
      const endTime = performance.now();
      expect(endTime - startTime).to.be.lessThan(2000);
    });
  });

  it('should handle search results pagination performance', () => {
    cy.visit('/hotels');
    
    // Perform search
    cy.get('[data-testid=destination]').type('London');
    cy.get('[data-testid=searchButton]').click();
    
    // Measure pagination time
    const startTime = performance.now();
    
    // Click next page
    cy.get('[data-testid=nextPage]').click();
    
    cy.get('[data-testid=searchResults]').should('be.visible').then(() => {
      const endTime = performance.now();
      expect(endTime - startTime).to.be.lessThan(1000);
    });
  });

  it('should handle dynamic content loading performance', () => {
    cy.visit('/profile');
    
    // Intercept API calls
    cy.intercept('GET', '**/api/bookings**').as('bookingsLoad');
    
    // Click bookings tab
    cy.get('[data-testid=bookingsTab]').click();
    
    // Check loading performance
    cy.wait('@bookingsLoad').then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
      expect(interception.response.duration).to.be.lessThan(800);
    });
  });

  it('should handle filter application performance', () => {
    cy.visit('/hotels');
    
    // Perform search
    cy.get('[data-testid=destination]').type('London');
    cy.get('[data-testid=searchButton]').click();
    
    // Measure filter application time
    const startTime = performance.now();
    
    // Apply filters
    cy.get('[data-testid=priceFilter]').click();
    cy.get('[data-testid=applyFilters]').click();
    
    cy.get('[data-testid=searchResults]').should('be.visible').then(() => {
      const endTime = performance.now();
      expect(endTime - startTime).to.be.lessThan(800);
    });
  });

  it('should handle image gallery performance', () => {
    cy.visit('/hotel-details/123');
    
    // Check image loading strategy
    cy.get('[data-testid=imageGallery]').within(() => {
      cy.get('img').first().should('be.visible');
      cy.get('img').not(':first').should('not.be.visible');
    });
  });

  it('should handle autocomplete performance', () => {
    cy.visit('/hotels');
    
    // Measure autocomplete response time
    const startTime = performance.now();
    
    // Type in search
    cy.get('[data-testid=destination]').type('Lon');
    
    cy.get('[data-testid=suggestionList]').should('be.visible').then(() => {
      const endTime = performance.now();
      expect(endTime - startTime).to.be.lessThan(300);
    });
  });

  it('should handle scroll performance', () => {
    cy.visit('/hotels');
    
    // Perform search
    cy.get('[data-testid=destination]').type('London');
    cy.get('[data-testid=searchButton]').click();
    
    // Measure infinite scroll performance
    cy.scrollTo('bottom');
    
    cy.get('[data-testid=loadingIndicator]').should('be.visible').then(() => {
      cy.get('[data-testid=loadingIndicator]').should('not.exist');
    });
  });
}); 