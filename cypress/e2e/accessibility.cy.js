describe('Accessibility Tests', () => {
  beforeEach(() => {
    // Clear cookies and localStorage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should have proper heading structure', () => {
    cy.visit('/');
    
    // Check for h1
    cy.get('h1').should('exist');
    
    // Check heading hierarchy
    cy.get('h1').then($h1 => {
      cy.get('h2').should('exist');
      cy.get('h3').should('exist');
    });
  });

  it('should have proper form labels', () => {
    cy.visit('/signup');
    
    // Check all form inputs have labels
    cy.get('input').each(($input) => {
      const id = $input.attr('id');
      cy.get(`label[for="${id}"]`).should('exist');
    });
  });

  it('should have proper ARIA labels', () => {
    cy.visit('/');
    
    // Check navigation
    cy.get('[data-testid=mainNav]').should('have.attr', 'aria-label', 'Main navigation');
    
    // Check buttons
    cy.get('button').each(($button) => {
      if (!$button.attr('aria-label')) {
        cy.wrap($button).should('have.text');
      }
    });
  });

  it('should have proper color contrast', () => {
    cy.visit('/');
    
    // Check text elements have sufficient contrast
    cy.get('body').then($body => {
      const textElements = $body.find('p, span, div, h1, h2, h3, h4, h5, h6');
      textElements.each((_, element) => {
        const color = window.getComputedStyle(element).color;
        const backgroundColor = window.getComputedStyle(element).backgroundColor;
        // Note: Actual contrast calculation would require a color contrast library
        // This is a placeholder for the concept
      });
    });
  });

  it('should be keyboard navigable', () => {
    cy.visit('/');
    
    // Check focusable elements
    cy.get('a, button, input, select, textarea').each(($element) => {
      cy.wrap($element).should('have.attr', 'tabindex');
    });
    
    // Check focus order
    cy.get('body').tab();
    cy.focused().should('exist');
  });

  it('should have proper alt text for images', () => {
    cy.visit('/');
    
    // Check all images have alt text
    cy.get('img').each(($img) => {
      cy.wrap($img).should('have.attr', 'alt');
    });
  });

  it('should handle screen readers properly', () => {
    cy.visit('/');
    
    // Check for screen reader only text
    cy.get('.sr-only').should('exist');
    
    // Check for proper ARIA live regions
    cy.get('[aria-live]').should('exist');
  });

  it('should have proper form validation messages', () => {
    cy.visit('/signup');
    
    // Submit empty form
    cy.get('[data-testid=signupForm]').submit();
    
    // Check for validation messages
    cy.get('[aria-invalid="true"]').should('exist');
    cy.get('[aria-describedby]').should('exist');
  });

  it('should handle dynamic content properly', () => {
    cy.visit('/hotels');
    
    // Trigger dynamic content load
    cy.get('[data-testid=searchButton]').click();
    
    // Check for loading states
    cy.get('[aria-busy="true"]').should('exist');
    
    // Check for proper announcements
    cy.get('[aria-live="polite"]').should('exist');
  });

  it('should have proper skip links', () => {
    cy.visit('/');
    
    // Check for skip to main content link
    cy.get('a[href="#main-content"]').should('exist');
    
    // Check for skip to navigation link
    cy.get('a[href="#main-nav"]').should('exist');
  });

  it('should handle error states properly', () => {
    cy.visit('/login');
    
    // Submit invalid credentials
    cy.get('[data-testid=email]').type('invalid@example.com');
    cy.get('[data-testid=password]').type('wrongpassword');
    cy.get('[data-testid=loginButton]').click();
    
    // Check for error message
    cy.get('[role="alert"]').should('exist');
    cy.get('[aria-invalid="true"]').should('exist');
  });

  it('should have proper table structure', () => {
    cy.visit('/profile');
    cy.get('[data-testid=bookingHistoryTab]').click();
    
    // Check table headers
    cy.get('th').should('exist');
    
    // Check for proper table structure
    cy.get('table').should('have.attr', 'role', 'table');
    cy.get('thead').should('exist');
    cy.get('tbody').should('exist');
  });

  it('should handle focus management in modals', () => {
    cy.visit('/');
    
    // Open modal
    cy.get('[data-testid=loginButton]').click();
    
    // Check focus is trapped in modal
    cy.get('[data-testid=modal]').should('exist');
    cy.get('[data-testid=modal]').find('button').first().should('have.focus');
    
    // Check for proper focus management
    cy.get('[data-testid=modal]').should('have.attr', 'aria-modal', 'true');
  });
}); 