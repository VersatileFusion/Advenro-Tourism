describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear cookies and localStorage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should successfully register a new user', () => {
    cy.visit('/register');
    
    // Fill in registration form
    cy.get('[data-testid=firstName]').type('John');
    cy.get('[data-testid=lastName]').type('Doe');
    cy.get('[data-testid=email]').type('john.doe@example.com');
    cy.get('[data-testid=password]').type('Password123!');
    cy.get('[data-testid=confirmPassword]').type('Password123!');
    
    // Submit form
    cy.get('[data-testid=registerButton]').click();
    
    // Assert successful registration
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid=userGreeting]').should('contain', 'John');
  });

  it('should show error for existing email during registration', () => {
    // First register a user
    cy.request('POST', `${Cypress.env('apiUrl')}/auth/register`, {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'Password123!'
    });

    // Try to register with same email
    cy.visit('/register');
    cy.get('[data-testid=firstName]').type('Another');
    cy.get('[data-testid=lastName]').type('User');
    cy.get('[data-testid=email]').type('test@example.com');
    cy.get('[data-testid=password]').type('Password123!');
    cy.get('[data-testid=confirmPassword]').type('Password123!');
    cy.get('[data-testid=registerButton]').click();

    // Assert error message
    cy.get('[data-testid=errorMessage]').should('contain', 'Email already registered');
  });

  it('should successfully login and logout', () => {
    // Create a test user
    cy.request('POST', `${Cypress.env('apiUrl')}/auth/register`, {
      firstName: 'Test',
      lastName: 'User',
      email: 'test.login@example.com',
      password: 'Password123!'
    });

    // Login
    cy.visit('/login');
    cy.get('[data-testid=email]').type('test.login@example.com');
    cy.get('[data-testid=password]').type('Password123!');
    cy.get('[data-testid=loginButton]').click();

    // Assert successful login
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid=userGreeting]').should('contain', 'Test');

    // Logout
    cy.get('[data-testid=userMenu]').click();
    cy.get('[data-testid=logoutButton]').click();

    // Assert successful logout
    cy.url().should('include', '/login');
  });

  it('should show error for invalid credentials', () => {
    cy.visit('/login');
    cy.get('[data-testid=email]').type('wrong@example.com');
    cy.get('[data-testid=password]').type('WrongPassword123!');
    cy.get('[data-testid=loginButton]').click();

    // Assert error message
    cy.get('[data-testid=errorMessage]').should('contain', 'Invalid credentials');
  });
}); 