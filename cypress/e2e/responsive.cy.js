describe('Responsive Design Tests', () => {
  beforeEach(() => {
    // Clear cookies and localStorage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  // Test different viewport sizes
  const viewports = [
    { width: 320, height: 568, name: 'iPhone 5' },
    { width: 375, height: 667, name: 'iPhone 6/7/8' },
    { width: 414, height: 736, name: 'iPhone 6/7/8 Plus' },
    { width: 768, height: 1024, name: 'iPad' },
    { width: 1024, height: 768, name: 'Desktop' },
    { width: 1440, height: 900, name: 'Large Desktop' }
  ];

  viewports.forEach(viewport => {
    context(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      beforeEach(() => {
        cy.viewport(viewport.width, viewport.height);
      });

      it('should display home page correctly', () => {
        cy.visit('/');
        
        // Check header/navigation
        cy.get('[data-testid=header]').should('be.visible');
        cy.get('[data-testid=mainNav]').should('be.visible');
        
        // Check hero section
        cy.get('[data-testid=heroSection]').should('be.visible');
        
        // Check search form
        cy.get('[data-testid=searchForm]').should('be.visible');
        
        // Check featured sections
        cy.get('[data-testid=featuredHotels]').should('be.visible');
        cy.get('[data-testid=featuredFlights]').should('be.visible');
      });

      it('should handle navigation menu correctly', () => {
        cy.visit('/');
        
        if (viewport.width < 768) {
          // Mobile menu should be toggleable
          cy.get('[data-testid=mobileMenuButton]').should('be.visible');
          cy.get('[data-testid=mobileMenuButton]').click();
          cy.get('[data-testid=mobileMenu]').should('be.visible');
        } else {
          // Desktop menu should be always visible
          cy.get('[data-testid=desktopMenu]').should('be.visible');
        }
      });

      it('should display search results correctly', () => {
        cy.visit('/hotels');
        
        // Fill search form
        cy.get('[data-testid=destination]').type('London');
        cy.get('[data-testid=searchButton]').click();
        
        // Check results layout
        cy.get('[data-testid=searchResults]').should('be.visible');
        cy.get('[data-testid=hotelCard]').should('have.length.at.least', 1);
        
        // Check filters sidebar
        if (viewport.width < 768) {
          cy.get('[data-testid=filterToggle]').should('be.visible');
          cy.get('[data-testid=filterToggle]').click();
          cy.get('[data-testid=filtersSidebar]').should('be.visible');
        } else {
          cy.get('[data-testid=filtersSidebar]').should('be.visible');
        }
      });

      it('should handle forms correctly', () => {
        cy.visit('/signup');
        
        // Check form layout
        cy.get('[data-testid=signupForm]').should('be.visible');
        
        // Fill form
        cy.get('[data-testid=firstName]').type('John');
        cy.get('[data-testid=lastName]').type('Doe');
        cy.get('[data-testid=email]').type('john@example.com');
        cy.get('[data-testid=password]').type('Password123!');
        
        // Check form elements are properly sized
        cy.get('input').each(($input) => {
          cy.wrap($input).should('be.visible');
          cy.wrap($input).should('have.css', 'height').and('not.be.lessThan', 40);
        });
      });

      it('should handle images correctly', () => {
        cy.visit('/hotels');
        
        // Check image loading and sizing
        cy.get('img').each(($img) => {
          cy.wrap($img).should('be.visible');
          cy.wrap($img).should('have.css', 'max-width').and('not.be.lessThan', 0);
        });
      });

      it('should handle modals correctly', () => {
        cy.visit('/');
        
        // Trigger a modal (e.g., login modal)
        cy.get('[data-testid=loginButton]').click();
        
        // Check modal positioning and overlay
        cy.get('[data-testid=modal]').should('be.visible');
        cy.get('[data-testid=modalOverlay]').should('be.visible');
        
        // Check modal content is properly sized
        cy.get('[data-testid=modalContent]').should('have.css', 'max-width').and('not.be.lessThan', 0);
      });

      it('should handle tables correctly', () => {
        cy.visit('/profile');
        cy.get('[data-testid=bookingHistoryTab]').click();
        
        // Check table responsiveness
        cy.get('[data-testid=bookingTable]').should('be.visible');
        
        if (viewport.width < 768) {
          // On mobile, table should be scrollable horizontally
          cy.get('[data-testid=bookingTable]').should('have.css', 'overflow-x', 'auto');
        }
      });

      it('should handle footer correctly', () => {
        cy.visit('/');
        
        // Scroll to bottom
        cy.scrollTo('bottom');
        
        // Check footer layout
        cy.get('[data-testid=footer]').should('be.visible');
        
        // Check footer links are properly spaced
        cy.get('[data-testid=footerLinks]').children().should('have.css', 'margin').and('not.be.lessThan', 0);
      });
    });
  });
}); 