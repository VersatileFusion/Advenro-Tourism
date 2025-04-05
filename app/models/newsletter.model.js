const fs = require('fs').promises;
const path = require('path');

// Path to the data file
const dataFile = path.join(__dirname, '../data/newsletter.json');

// Initialize the data file if it doesn't exist
async function initDataFile() {
  try {
    await fs.access(dataFile);
  } catch (error) {
    // File doesn't exist, create it with empty array
    const directory = path.dirname(dataFile);
    try {
      await fs.mkdir(directory, { recursive: true });
    } catch (mkdirError) {
      // Directory may already exist, ignore error
      console.log('Directory already exists or could not be created');
    }
    await fs.writeFile(dataFile, JSON.stringify({ subscribers: [] }));
  }
}

// Read all subscribers from the data file
async function readData() {
  await initDataFile();
  const data = await fs.readFile(dataFile, 'utf8');
  return JSON.parse(data);
}

// Write subscribers to the data file
async function writeData(data) {
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
}

// Newsletter model
const Newsletter = {
  /**
   * Find a subscriber by email
   * @param {string} email - Email to search for
   * @returns {Object|null} - Subscriber object or null if not found
   */
  async findByEmail(email) {
    const data = await readData();
    return data.subscribers.find(subscriber => 
      subscriber.email.toLowerCase() === email.toLowerCase()
    ) || null;
  },

  /**
   * Create a new newsletter subscription
   * @param {Object} subscriberData - Subscriber data
   * @returns {Object} - Created subscriber
   */
  async create(subscriberData) {
    const data = await readData();
    data.subscribers.push(subscriberData);
    await writeData(data);
    return subscriberData;
  },

  /**
   * Update a subscription
   * @param {string} id - Subscriber ID
   * @param {Object} updateData - Data to update
   * @returns {Object|null} - Updated subscriber or null if not found
   */
  async updateSubscription(id, updateData) {
    const data = await readData();
    const index = data.subscribers.findIndex(subscriber => subscriber.id === id);
    
    if (index === -1) return null;
    
    data.subscribers[index] = {
      ...data.subscribers[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    await writeData(data);
    return data.subscribers[index];
  },

  /**
   * Get all subscribers with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Object} - Object containing total count and subscribers
   */
  async getAll({ status, page = 1, limit = 20 }) {
    const data = await readData();
    let subscribers = [...data.subscribers];
    
    // Apply status filter if provided
    if (status) {
      subscribers = subscribers.filter(subscriber => 
        subscriber.status === status
      );
    }
    
    // Calculate total before pagination
    const total = subscribers.length;
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    subscribers = subscribers.slice(startIndex, endIndex);
    
    return {
      total,
      subscribers
    };
  }
};

module.exports = Newsletter; 