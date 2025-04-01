const chai = require('chai');
const expect = chai.expect;
const bcrypt = require('bcryptjs');

// Simple test for password hashing without database connection
describe('User Password Hashing', () => {
  it('should correctly hash a password', async () => {
    const plainPassword = 'TestPassword123!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    // Password should be hashed, not stored in plain text
    expect(hashedPassword).to.not.equal(plainPassword);
    // Hashed passwords are typically long strings
    expect(hashedPassword.length).to.be.gt(20);
    
    // Verify that hashed password matches original
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    expect(isMatch).to.be.true;
    
    // And doesn't match incorrect password
    const isWrongMatch = await bcrypt.compare('WrongPassword123!', hashedPassword);
    expect(isWrongMatch).to.be.false;
  });
}); 