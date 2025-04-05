/**
 * Basic Test Script to verify test setup
 */

// Set test environment
process.env.NODE_ENV = "test";

const chai = require("chai");
const expect = chai.expect;

describe("Basic Test", function() {
  it("should pass a simple assertion", function() {
    expect(true).to.equal(true);
  });
  
  it("should handle math correctly", function() {
    expect(1 + 1).to.equal(2);
  });
}); 