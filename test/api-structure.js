/**
 * API Structure Test - Tests the existence of critical files in the application
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

// Function to check if a route file exists in the routes directory
function routeFileExists(routeName) {
  try {
    // Check in routes directory
    const routePath = path.join(__dirname, '..', 'src', 'routes', `${routeName}.js`);
    return fs.existsSync(routePath);
  } catch (err) {
    return false;
  }
}

// Function to check if a controller file exists
function controllerFileExists(controllerName) {
  try {
    // Check in controllers directory
    const controllerPath = path.join(__dirname, '..', 'src', 'controllers', `${controllerName}.js`);
    return fs.existsSync(controllerPath);
  } catch (err) {
    return false;
  }
}

// Function to check if a model file exists
function modelFileExists(modelName) {
  try {
    // Check in models directory
    const modelPath = path.join(__dirname, '..', 'src', 'models', `${modelName}.js`);
    return fs.existsSync(modelPath);
  } catch (err) {
    return false;
  }
}

describe("Advenro API Structure", function() {
  
  describe("Core Files", function() {
    it("should have server.js file", function() {
      const exists = fileExists(path.join(__dirname, '..', 'src', 'server.js'));
      expect(exists).to.be.true;
    });
    
    it("should have error middleware", function() {
      const exists = fileExists(path.join(__dirname, '..', 'src', 'middleware', 'error.js'));
      expect(exists).to.be.true;
    });
  });
  
  describe("Route Files", function() {
    it("should have auth route file", function() {
      const exists = routeFileExists('auth');
      expect(exists).to.be.true;
    });
    
    it("should have users route file", function() {
      const exists = routeFileExists('users');
      expect(exists).to.be.true;
    });
    
    it("should have hotels route file", function() {
      const exists = routeFileExists('hotels');
      expect(exists).to.be.true;
    });
    
    it("should have tours route file", function() {
      const exists = routeFileExists('tours');
      expect(exists).to.be.true;
    });
    
    it("should have bookings route file", function() {
      const exists = routeFileExists('bookings');
      expect(exists).to.be.true;
    });
    
    it("should have payments route file", function() {
      const exists = routeFileExists('payments');
      expect(exists).to.be.true;
    });
    
    it("should have destinations route file", function() {
      const exists = routeFileExists('destinations');
      expect(exists).to.be.true;
    });
  });
  
  describe("Controller Files", function() {
    it("should have authController", function() {
      const exists = controllerFileExists('authController');
      expect(exists).to.be.true;
    });
    
    it("should have userController", function() {
      const exists = controllerFileExists('userController');
      expect(exists).to.be.true;
    });
    
    it("should have hotelController", function() {
      const exists = controllerFileExists('hotelController');
      expect(exists).to.be.true;
    });
    
    it("should have tourController", function() {
      const exists = controllerFileExists('tourController');
      expect(exists).to.be.true;
    });
    
    it("should have bookingController", function() {
      const exists = controllerFileExists('bookingController');
      expect(exists).to.be.true;
    });
    
    it("should have paymentController", function() {
      const exists = controllerFileExists('paymentController');
      expect(exists).to.be.true;
    });
    
    it("should have destinationController", function() {
      const exists = controllerFileExists('destinationController');
      expect(exists).to.be.true;
    });
    
    it("should have userFavoritesController", function() {
      const exists = controllerFileExists('userFavoritesController');
      expect(exists).to.be.true;
    });
    
    it("should have userBookingsController", function() {
      const exists = controllerFileExists('userBookingsController');
      expect(exists).to.be.true;
    });
  });
  
  describe("Model Files", function() {
    it("should have User model", function() {
      const exists = modelFileExists('User');
      expect(exists).to.be.true;
    });
    
    it("should have Hotel model", function() {
      const exists = modelFileExists('Hotel');
      expect(exists).to.be.true;
    });
    
    it("should have Tour model", function() {
      const exists = modelFileExists('Tour');
      expect(exists).to.be.true;
    });
    
    it("should have Booking model", function() {
      const exists = modelFileExists('Booking');
      expect(exists).to.be.true;
    });
    
    it("should have Review model", function() {
      const exists = modelFileExists('Review');
      expect(exists).to.be.true;
    });
    
    it("should have Favorite model", function() {
      const exists = modelFileExists('Favorite');
      expect(exists).to.be.true;
    });
  });
}); 