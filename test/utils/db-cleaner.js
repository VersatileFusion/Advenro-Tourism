/**
 * Database cleaner utility for tests
 * 
 * This file provides functions to clear the database between test runs
 * to prevent test data contamination
 */

const mongoose = require('mongoose');

/**
 * Clears all collections in the database
 * @returns {Promise<void>}
 */
async function clearDatabase() {
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    throw new Error('Database connection not established');
  }

  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
  
  console.log('🧹 Database cleared');
}

/**
 * Clears specific collections in the database
 * @param {Array<string>} collectionNames - Names of collections to clear
 * @returns {Promise<void>}
 */
async function clearCollections(collectionNames) {
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    throw new Error('Database connection not established');
  }

  const collections = mongoose.connection.collections;
  
  for (const name of collectionNames) {
    if (collections[name]) {
      await collections[name].deleteMany({});
      console.log(`🧹 Collection ${name} cleared`);
    }
  }
}

/**
 * Disconnects from the database
 */
async function disconnect() {
  if (mongoose.connection && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('Disconnected from test database');
  }
}

module.exports = {
  clearDatabase,
  clearCollections,
  disconnect
}; 