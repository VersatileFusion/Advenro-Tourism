const mongoose = require('mongoose');
const logger = require('./loggingService');

class IndexService {
    constructor() {
        this.indexDefinitions = {
            users: [
                {
                    fields: { email: 1 },
                    options: { unique: true }
                },
                {
                    fields: { lastLogin: 1 },
                    options: { background: true }
                },
                {
                    fields: { role: 1 },
                    options: { background: true }
                }
            ],
            bookings: [
                {
                    fields: { userId: 1, status: 1 },
                    options: { background: true }
                },
                {
                    fields: { tourId: 1, startDate: 1 },
                    options: { background: true }
                },
                {
                    fields: { createdAt: 1 },
                    options: { background: true }
                },
                {
                    fields: { paymentStatus: 1 },
                    options: { background: true }
                }
            ],
            tours: [
                {
                    fields: { price: 1, difficulty: 1 },
                    options: { background: true }
                },
                {
                    fields: { startDates: 1 },
                    options: { background: true }
                },
                {
                    fields: { averageRating: -1 },
                    options: { background: true }
                },
                {
                    fields: { name: 'text', description: 'text' },
                    options: {
                        weights: {
                            name: 10,
                            description: 5
                        },
                        background: true
                    }
                }
            ],
            reviews: [
                {
                    fields: { tourId: 1, rating: -1 },
                    options: { background: true }
                },
                {
                    fields: { userId: 1 },
                    options: { background: true }
                },
                {
                    fields: { createdAt: -1 },
                    options: { background: true }
                }
            ]
        };
    }

    async createIndexes() {
        try {
            for (const [collectionName, indexes] of Object.entries(this.indexDefinitions)) {
                const collection = mongoose.connection.collection(collectionName);
                
                for (const index of indexes) {
                    logger.info(`Creating index for ${collectionName}`, {
                        fields: index.fields
                    });

                    await collection.createIndex(index.fields, index.options);
                }
            }

            logger.info('All indexes created successfully');
        } catch (error) {
            logger.error('Error creating indexes', error);
            throw error;
        }
    }

    async dropIndexes(collectionName) {
        try {
            const collection = mongoose.connection.collection(collectionName);
            await collection.dropIndexes();
            logger.info(`Dropped all indexes for ${collectionName}`);
        } catch (error) {
            logger.error(`Error dropping indexes for ${collectionName}`, error);
            throw error;
        }
    }

    async getIndexStats() {
        try {
            const stats = {};
            
            for (const collectionName of Object.keys(this.indexDefinitions)) {
                const collection = mongoose.connection.collection(collectionName);
                const indexes = await collection.indexes();
                
                stats[collectionName] = {
                    count: indexes.length,
                    indexes: indexes.map(index => ({
                        name: index.name,
                        fields: index.key,
                        properties: {
                            unique: index.unique || false,
                            sparse: index.sparse || false,
                            background: index.background || false
                        }
                    }))
                };
            }

            return stats;
        } catch (error) {
            logger.error('Error getting index stats', error);
            throw error;
        }
    }

    async analyzeIndexUsage(collectionName) {
        try {
            const collection = mongoose.connection.collection(collectionName);
            const result = await collection.aggregate([
                { $indexStats: {} }
            ]).toArray();

            logger.info(`Index usage stats for ${collectionName}`, { stats: result });
            return result;
        } catch (error) {
            logger.error(`Error analyzing index usage for ${collectionName}`, error);
            throw error;
        }
    }

    async optimizeIndexes(collectionName) {
        try {
            // Get current indexes
            const collection = mongoose.connection.collection(collectionName);
            const currentIndexes = await collection.indexes();
            const indexStats = await this.analyzeIndexUsage(collectionName);

            // Find unused indexes (no accesses in the last month)
            const unusedIndexes = currentIndexes.filter(index => {
                const stats = indexStats.find(stat => stat.name === index.name);
                if (!stats) return true;
                
                const lastAccess = new Date(stats.accesses.ops[0].since);
                const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                
                return lastAccess < monthAgo;
            });

            // Drop unused indexes (except _id_ and unique indexes)
            for (const index of unusedIndexes) {
                if (index.name !== '_id_' && !index.unique) {
                    await collection.dropIndex(index.name);
                    logger.info(`Dropped unused index ${index.name} from ${collectionName}`);
                }
            }

            // Rebuild indexes in the background
            const indexes = this.indexDefinitions[collectionName] || [];
            for (const index of indexes) {
                await collection.createIndex(index.fields, {
                    ...index.options,
                    background: true
                });
            }

            logger.info(`Optimized indexes for ${collectionName}`);
        } catch (error) {
            logger.error(`Error optimizing indexes for ${collectionName}`, error);
            throw error;
        }
    }

    async validateIndexes(collectionName) {
        try {
            const collection = mongoose.connection.collection(collectionName);
            const result = await collection.validate({ full: true });

            logger.info(`Index validation results for ${collectionName}`, { result });
            return result;
        } catch (error) {
            logger.error(`Error validating indexes for ${collectionName}`, error);
            throw error;
        }
    }
}

module.exports = new IndexService(); 