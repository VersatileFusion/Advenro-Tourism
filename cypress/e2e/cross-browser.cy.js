describe('Cross-Browser Compatibility Tests', () => {
  beforeEach(() => {
    // Clear cookies and localStorage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should handle date inputs consistently', () => {
    cy.visit('/hotels');
    
    // Test date input in different browsers
    cy.get('[data-testid=checkIn]').type('2024-05-01');
    cy.get('[data-testid=checkOut]').type('2024-05-05');
    
    // Verify date format
    cy.get('[data-testid=checkIn]').should('have.value', '2024-05-01');
    cy.get('[data-testid=checkOut]').should('have.value', '2024-05-05');
  });

  it('should handle file uploads consistently', () => {
    cy.visit('/profile');
    
    // Test file upload
    cy.get('[data-testid=fileInput]').attachFile('test-image.jpg');
    
    // Verify upload success
    cy.get('[data-testid=uploadSuccess]').should('be.visible');
  });

  it('should handle form validation consistently', () => {
    cy.visit('/signup');
    
    // Test form validation
    cy.get('[data-testid=signupForm]').submit();
    
    // Verify validation messages
    cy.get('[data-testid=validationError]').should('be.visible');
  });

  it('should handle CSS Grid and Flexbox consistently', () => {
    cy.visit('/');
    
    // Check layout properties
    cy.get('[data-testid=header]').should('have.css', 'display', 'flex');
    cy.get('[data-testid=mainContent]').should('have.css', 'display', 'grid');
  });

  it('should handle CSS transforms consistently', () => {
    cy.visit('/hotels');
    
    // Check transform properties
    cy.get('[data-testid=cardHover]').trigger('mouseenter');
    cy.get('[data-testid=cardHover]').should('have.css', 'transform');
  });

  it('should handle CSS animations consistently', () => {
    cy.visit('/');
    
    // Check animation properties
    cy.get('[data-testid=animatedElement]').should('have.css', 'animation');
  });

  it('should handle CSS variables consistently', () => {
    cy.visit('/');
    
    // Check CSS variable usage
    cy.get('body').should('have.css', '--primary-color');
    cy.get('body').should('have.css', '--secondary-color');
  });

  it('should handle media queries consistently', () => {
    cy.visit('/');
    
    // Test different viewport sizes
    cy.viewport(320, 568); // iPhone 5
    cy.get('[data-testid=mobileMenu]').should('be.visible');
    
    cy.viewport(1024, 768); // Desktop
    cy.get('[data-testid=desktopMenu]').should('be.visible');
  });

  it('should handle JavaScript APIs consistently', () => {
    cy.visit('/');
    
    // Test localStorage
    cy.window().then((win) => {
      win.localStorage.setItem('test', 'value');
      expect(win.localStorage.getItem('test')).to.equal('value');
    });
    
    // Test sessionStorage
    cy.window().then((win) => {
      win.sessionStorage.setItem('test', 'value');
      expect(win.sessionStorage.getItem('test')).to.equal('value');
    });
  });

  it('should handle event listeners consistently', () => {
    cy.visit('/');
    
    // Test click events
    cy.get('[data-testid=button]').click();
    cy.get('[data-testid=clickResult]').should('be.visible');
    
    // Test hover events
    cy.get('[data-testid=hoverElement]').trigger('mouseenter');
    cy.get('[data-testid=hoverResult]').should('be.visible');
  });

  it('should handle form submission consistently', () => {
    cy.visit('/login');
    
    // Test form submission
    cy.get('[data-testid=email]').type('test@example.com');
    cy.get('[data-testid=password]').type('Password123!');
    cy.get('[data-testid=loginForm]').submit();
    
    // Verify submission
    cy.url().should('include', '/dashboard');
  });

  it('should handle AJAX requests consistently', () => {
    cy.visit('/hotels');
    
    // Intercept API calls
    cy.intercept('GET', '**/api/hotels**').as('hotelSearch');
    
    // Trigger search
    cy.get('[data-testid=searchButton]').click();
    
    // Verify request
    cy.wait('@hotelSearch').then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
    });
  });

  it('should handle WebSocket connections consistently', () => {
    cy.visit('/chat');
    
    // Test WebSocket connection
    cy.window().then((win) => {
      const ws = new win.WebSocket('ws://localhost:3000/ws');
      ws.onopen = () => {
        expect(ws.readyState).to.equal(1);
      };
    });
  });

  it('should handle SVG rendering consistently', () => {
    cy.visit('/');
    
    // Check SVG elements
    cy.get('svg').should('exist');
    cy.get('svg').should('have.attr', 'viewBox');
  });

  it('should handle canvas rendering consistently', () => {
    cy.visit('/');
    
    // Check canvas elements
    cy.get('canvas').should('exist');
    cy.get('canvas').should('have.attr', 'width');
    cy.get('canvas').should('have.attr', 'height');
  });

  it('should handle video playback consistently', () => {
    cy.visit('/');
    
    // Check video elements
    cy.get('video').should('exist');
    cy.get('video').should('have.attr', 'controls');
    cy.get('video').should('have.attr', 'src');
  });

  it('should handle audio playback consistently', () => {
    cy.visit('/');
    
    // Check audio elements
    cy.get('audio').should('exist');
    cy.get('audio').should('have.attr', 'controls');
    cy.get('audio').should('have.attr', 'src');
  });
}); 