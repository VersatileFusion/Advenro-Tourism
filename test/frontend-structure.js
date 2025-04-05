/**
 * Frontend Structure Test - Tests the existence of critical frontend files
 */

// Set test environment
process.env.NODE_ENV = "test";

const chai = require("chai");
const expect = chai.expect;
const path = require("path");
const fs = require("fs");

// Function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Function to check if a file in public directory exists
function publicFileExists(relativePath) {
  try {
    const filePath = path.join(__dirname, '..', 'public', relativePath);
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Function to check if a file in public/js directory exists
function jsFileExists(filename) {
  return publicFileExists(path.join('js', filename));
}

// Function to check if a file in public/js/services directory exists
function serviceFileExists(filename) {
  return publicFileExists(path.join('js', 'services', filename));
}

// Function to check if a css file exists
function cssFileExists(filename) {
  return publicFileExists(path.join('css', filename));
}

describe("Advenro Frontend Structure", function() {
  
  describe("HTML Pages", function() {
    it("should have index.html", function() {
      const exists = publicFileExists('index.html');
      expect(exists).to.be.true;
    });
    
    it("should have signin.html", function() {
      const exists = publicFileExists('signin.html');
      expect(exists).to.be.true;
    });
    
    it("should have signup.html", function() {
      const exists = publicFileExists('signup.html');
      expect(exists).to.be.true;
    });
    
    it("should have profile.html", function() {
      const exists = publicFileExists('profile.html');
      expect(exists).to.be.true;
    });
    
    it("should have my-bookings.html", function() {
      const exists = publicFileExists('my-bookings.html');
      expect(exists).to.be.true;
    });
  });
  
  describe("JavaScript Files", function() {
    it("should have main.js", function() {
      const exists = jsFileExists('main.js');
      expect(exists).to.be.true;
    });
    
    it("should have auth.js", function() {
      const exists = jsFileExists('auth.js');
      expect(exists).to.be.true;
    });
    
    it("should have my-bookings.js", function() {
      const exists = jsFileExists('my-bookings.js');
      expect(exists).to.be.true;
    });
  });
  
  describe("Service Files", function() {
    it("should have api.service.js", function() {
      const exists = serviceFileExists('api.service.js');
      expect(exists).to.be.true;
    });
    
    it("should have auth.service.js", function() {
      const exists = serviceFileExists('auth.service.js');
      expect(exists).to.be.true;
    });
    
    it("should have hotel.service.js", function() {
      const exists = serviceFileExists('hotel.service.js');
      expect(exists).to.be.true;
    });
    
    it("should have review.service.js", function() {
      const exists = serviceFileExists('review.service.js');
      expect(exists).to.be.true;
    });
  });
  
  describe("CSS Files", function() {
    it("should have main.css", function() {
      const exists = cssFileExists('main.css');
      expect(exists).to.be.true;
    });
    
    it("should have bookings.css", function() {
      const exists = cssFileExists('bookings.css');
      expect(exists).to.be.true;
    });
    
    it("should have common.css", function() {
      const exists = cssFileExists('common.css');
      expect(exists).to.be.true;
    });
    
    it("should have navbar.css", function() {
      const exists = cssFileExists('navbar.css');
      expect(exists).to.be.true;
    });
  });
}); 