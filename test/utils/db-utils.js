const sinon = require('sinon');

/**
 * Mock a Mongoose model for testing
 * @param {Object} mockData - Data to return from find operations
 * @returns {Object} - Mocked Mongoose model
 */
function createMockModel(mockData = []) {
  return {
    find: sinon.stub().returns({
      sort: sinon.stub().returnsThis(),
      limit: sinon.stub().returnsThis(),
      skip: sinon.stub().returnsThis(),
      exec: sinon.stub().resolves(mockData),
      populate: sinon.stub().returnsThis()
    }),
    findById: sinon.stub().callsFake((id) => ({
      populate: sinon.stub().returnsThis(),
      exec: sinon.stub().resolves(mockData.find(item => item._id.toString() === id.toString()))
    })),
    findOne: sinon.stub().callsFake((query) => ({
      exec: sinon.stub().resolves(mockData.find(item => 
        Object.keys(query).every(key => item[key] === query[key])
      ))
    })),
    create: sinon.stub().callsFake(async (data) => {
      if (Array.isArray(data)) {
        return data.map(item => ({ _id: `mock_id_${Date.now()}`, ...item }));
      }
      return { _id: `mock_id_${Date.now()}`, ...data };
    }),
    findByIdAndUpdate: sinon.stub().callsFake((id, update) => ({
      exec: sinon.stub().resolves({ _id: id, ...update })
    })),
    findByIdAndDelete: sinon.stub().callsFake((id) => ({
      exec: sinon.stub().resolves({ _id: id, deleted: true })
    })),
    countDocuments: sinon.stub().resolves(mockData.length)
  };
}

/**
 * Create mock database collections for testing
 * @param {Object} collections - Object with collection names and mock data
 * @returns {Object} - Object with mocked collections
 */
function createMockDb(collections = {}) {
  const mockDb = {};
  
  Object.keys(collections).forEach(collectionName => {
    mockDb[collectionName] = createMockModel(collections[collectionName]);
  });
  
  return mockDb;
}

/**
 * Generate a mock MongoDB ObjectId
 * @returns {String} - Mock ObjectId
 */
function generateMockObjectId() {
  const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
  const objectId = timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => {
    return Math.floor(Math.random() * 16).toString(16);
  });
  
  return objectId;
}

/**
 * Mock mongoose connection functions
 * @returns {Object} - Mocked mongoose functions
 */
function mockMongooseConnection() {
  return {
    connect: sinon.stub().resolves(),
    connection: {
      on: sinon.stub(),
      once: sinon.stub(),
      close: sinon.stub().resolves()
    }
  };
}

module.exports = {
  createMockModel,
  createMockDb,
  generateMockObjectId,
  mockMongooseConnection
}; 