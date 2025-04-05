/**
 * Core API Tests - Validates API endpoints without database connections
 */

// Set test environment
process.env.NODE_ENV = "test";

const chai = require("chai");
const expect = chai.expect;
const request = require("supertest");
const sinon = require("sinon");

// Import app (adjust path as needed)
let app;
try {
  app = require("../src/server/app");
} catch (err) {
  console.error("Could not load app from src/server/app:", err.message);
  try {
    app = require("../src/server");
    console.log("Successfully loaded app from src/server");
  } catch (err) {
    console.error("Could not load app from src/server either:", err.message);
    console.error("Please ensure the server file path is correct");
    process.exit(1);
  }
}

describe("Advenro API Structure Tests", function() {
  this.timeout(10000);
  
  // Test the existence of core API routes
  describe("API Routes Existence", function() {
    it("should have /api/auth/register route", function(done) {
      request(app)
        .post("/api/auth/register")
        .send({})
        .end((err, res) => {
          // We only care that the route exists, not the response
          expect(res.status).to.not.equal(404);
          done();
        });
    });
    
    it("should have /api/auth/login route", function(done) {
      request(app)
        .post("/api/auth/login")
        .send({})
        .end((err, res) => {
          expect(res.status).to.not.equal(404);
          done();
        });
    });
    
    it("should have /api/hotels route", function(done) {
      request(app)
        .get("/api/hotels")
        .end((err, res) => {
          expect(res.status).to.not.equal(404);
          done();
        });
    });
    
    it("should have /api/tours route", function(done) {
      request(app)
        .get("/api/tours")
        .end((err, res) => {
          expect(res.status).to.not.equal(404);
          done();
        });
    });
    
    it("should have /api/users/bookings route", function(done) {
      request(app)
        .get("/api/users/bookings")
        .end((err, res) => {
          // Even if unauthorized, the route should exist
          expect(res.status).to.not.equal(404);
          done();
        });
    });
    
    it("should have /api/payments/create-payment-intent route", function(done) {
      request(app)
        .post("/api/payments/create-payment-intent")
        .send({})
        .end((err, res) => {
          expect(res.status).to.not.equal(404);
          done();
        });
    });
  });
}); 