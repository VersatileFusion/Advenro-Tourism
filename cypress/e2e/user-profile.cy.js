describe('User Profile Management', () => {
  beforeEach(() => {
    // Clear cookies and localStorage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Login before each test
    cy.request('POST', `${Cypress.env('apiUrl')}/auth/register`, {
      firstName: 'Test',
      lastName: 'User',
      email: 'test.profile@example.com',
      password: 'Password123!'
    });
    
    cy.visit('/login');
    cy.get('[data-testid=email]').type('test.profile@example.com');
    cy.get('[data-testid=password]').type('Password123!');
    cy.get('[data-testid=loginButton]').click();
  });

  it('should view user profile', () => {
    cy.visit('/profile');
    
    // Assert profile information
    cy.get('[data-testid=profileName]').should('contain', 'Test User');
    cy.get('[data-testid=profileEmail]').should('contain', 'test.profile@example.com');
  });

  it('should update personal information', () => {
    cy.visit('/profile');
    
    // Click edit button
    cy.get('[data-testid=editProfileButton]').click();
    
    // Update information
    cy.get('[data-testid=firstName]').clear().type('Updated');
    cy.get('[data-testid=lastName]').clear().type('Name');
    cy.get('[data-testid=phone]').type('1234567890');
    
    // Save changes
    cy.get('[data-testid=saveProfileButton]').click();
    
    // Assert updated information
    cy.get('[data-testid=profileName]').should('contain', 'Updated Name');
    cy.get('[data-testid=profilePhone]').should('contain', '1234567890');
  });

  it('should change password', () => {
    cy.visit('/profile');
    
    // Navigate to security settings
    cy.get('[data-testid=securityTab]').click();
    
    // Fill password change form
    cy.get('[data-testid=currentPassword]').type('Password123!');
    cy.get('[data-testid=newPassword]').type('NewPassword123!');
    cy.get('[data-testid=confirmPassword]').type('NewPassword123!');
    
    // Submit form
    cy.get('[data-testid=changePasswordButton]').click();
    
    // Assert success message
    cy.get('[data-testid=successMessage]').should('contain', 'Password updated successfully');
  });

  it('should handle invalid password change', () => {
    cy.visit('/profile');
    cy.get('[data-testid=securityTab]').click();
    
    // Try to change password with wrong current password
    cy.get('[data-testid=currentPassword]').type('WrongPassword123!');
    cy.get('[data-testid=newPassword]').type('NewPassword123!');
    cy.get('[data-testid=confirmPassword]').type('NewPassword123!');
    cy.get('[data-testid=changePasswordButton]').click();
    
    // Assert error message
    cy.get('[data-testid=errorMessage]').should('contain', 'Current password is incorrect');
  });

  it('should manage payment methods', () => {
    cy.visit('/profile');
    
    // Navigate to payment methods
    cy.get('[data-testid=paymentMethodsTab]').click();
    
    // Add new payment method
    cy.get('[data-testid=addPaymentMethodButton]').click();
    cy.get('[data-testid=cardNumber]').type('4111111111111111');
    cy.get('[data-testid=expiryDate]').type('1225');
    cy.get('[data-testid=cvv]').type('123');
    cy.get('[data-testid=saveCardButton]').click();
    
    // Assert card was added
    cy.get('[data-testid=paymentMethodCard]').should('be.visible');
  });

  it('should view booking history', () => {
    cy.visit('/profile');
    
    // Navigate to booking history
    cy.get('[data-testid=bookingHistoryTab]').click();
    
    // Assert booking history section
    cy.get('[data-testid=bookingHistory]').should('be.visible');
  });

  it('should handle profile picture upload', () => {
    cy.visit('/profile');
    
    // Click upload picture button
    cy.get('[data-testid=uploadPictureButton]').click();
    
    // Upload test image
    cy.get('[data-testid=fileInput]').attachFile('test-profile.jpg');
    
    // Assert image was uploaded
    cy.get('[data-testid=profilePicture]').should('be.visible');
  });

  it('should handle notification preferences', () => {
    cy.visit('/profile');
    
    // Navigate to notification settings
    cy.get('[data-testid=notificationsTab]').click();
    
    // Toggle notification preferences
    cy.get('[data-testid=emailNotifications]').click();
    cy.get('[data-testid=smsNotifications]').click();
    
    // Save preferences
    cy.get('[data-testid=savePreferencesButton]').click();
    
    // Assert preferences were saved
    cy.get('[data-testid=successMessage]').should('contain', 'Preferences updated successfully');
  });
}); 