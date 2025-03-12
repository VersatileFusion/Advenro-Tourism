const mongoose = require('mongoose');
const logger = require('./loggingService');
const { Booking, User, Tour, Review } = require('../models');

class ArchiveService {
    constructor() {
        // Define archival rules
        this.archivalRules = {
            bookings: {
                collection: 'bookings',
                conditions: {
                    status: { $in: ['completed', 'cancelled'] },
                    createdAt: { $lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } // 1 year old
                },
                model: Booking
            },
            users: {
                collection: 'users',
                conditions: {
                    lastLogin: { $lt: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000) }, // 2 years inactive
                    isDeleted: true
                },
                model: User
            },
            tours: {
                collection: 'tours',
                conditions: {
                    isActive: false,
                    lastUpdated: { $lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } // 1 year since last update
                },
                model: Tour
            },
            reviews: {
                collection: 'reviews',
                conditions: {
                    createdAt: { $lt: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000) } // 2 years old
                },
                model: Review
            }
        };

        // Create archive collections if they don't exist
        this.initializeArchiveCollections();
    }

    async initializeArchiveCollections() {
        try {
            for (const key in this.archivalRules) {
                const collectionName = `${this.archivalRules[key].collection}_archive`;
                if (!mongoose.connection.collections[collectionName]) {
                    await mongoose.connection.createCollection(collectionName);
                    logger.info(`Created archive collection: ${collectionName}`);
                }
            }
        } catch (error) {
            logger.error('Error initializing archive collections', error);
        }
    }

    async archiveDocuments(collectionKey) {
        const rule = this.archivalRules[collectionKey];
        if (!rule) {
            throw new Error(`No archival rule found for collection: ${collectionKey}`);
        }

        const archiveCollectionName = `${rule.collection}_archive`;
        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {
                // Find documents to archive
                const documents = await rule.model
                    .find(rule.conditions)
                    .session(session);

                if (documents.length === 0) {
                    logger.info(`No documents to archive for ${collectionKey}`);
                    return;
                }

                // Add archive metadata
                const archiveData = documents.map(doc => ({
                    ...doc.toObject(),
                    archivedAt: new Date(),
                    originalId: doc._id
                }));

                // Insert into archive collection
                await mongoose.connection.collection(archiveCollectionName)
                    .insertMany(archiveData, { session });

                // Delete from original collection
                const ids = documents.map(doc => doc._id);
                await rule.model.deleteMany(
                    { _id: { $in: ids } },
                    { session }
                );

                logger.info(`Archived ${documents.length} documents from ${collectionKey}`, {
                    count: documents.length,
                    collection: collectionKey
                });
            });
        } catch (error) {
            logger.error(`Error archiving documents for ${collectionKey}`, error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    async restoreFromArchive(collectionKey, conditions = {}) {
        const rule = this.archivalRules[collectionKey];
        if (!rule) {
            throw new Error(`No archival rule found for collection: ${collectionKey}`);
        }

        const archiveCollectionName = `${rule.collection}_archive`;
        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {
                // Find documents to restore
                const documents = await mongoose.connection
                    .collection(archiveCollectionName)
                    .find({ ...conditions })
                    .toArray();

                if (documents.length === 0) {
                    logger.info(`No documents to restore for ${collectionKey}`);
                    return;
                }

                // Remove archive metadata
                const restoreData = documents.map(doc => {
                    const { archivedAt, originalId, ...data } = doc;
                    return data;
                });

                // Insert back into original collection
                await rule.model.insertMany(restoreData, { session });

                // Delete from archive
                const ids = documents.map(doc => doc._id);
                await mongoose.connection.collection(archiveCollectionName)
                    .deleteMany({ _id: { $in: ids } }, { session });

                logger.info(`Restored ${documents.length} documents to ${collectionKey}`, {
                    count: documents.length,
                    collection: collectionKey
                });
            });
        } catch (error) {
            logger.error(`Error restoring documents for ${collectionKey}`, error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    async getArchiveStats() {
        try {
            const stats = {};
            for (const key in this.archivalRules) {
                const archiveCollectionName = `${this.archivalRules[key].collection}_archive`;
                stats[key] = await mongoose.connection
                    .collection(archiveCollectionName)
                    .countDocuments();
            }
            return stats;
        } catch (error) {
            logger.error('Error getting archive stats', error);
            throw error;
        }
    }

    async cleanupArchive(collectionKey, age = 5 * 365 * 24 * 60 * 60 * 1000) { // 5 years
        const rule = this.archivalRules[collectionKey];
        if (!rule) {
            throw new Error(`No archival rule found for collection: ${collectionKey}`);
        }

        const archiveCollectionName = `${rule.collection}_archive`;

        try {
            const result = await mongoose.connection
                .collection(archiveCollectionName)
                .deleteMany({
                    archivedAt: { $lt: new Date(Date.now() - age) }
                });

            logger.info(`Cleaned up old archives for ${collectionKey}`, {
                deleted: result.deletedCount,
                collection: collectionKey
            });

            return result.deletedCount;
        } catch (error) {
            logger.error(`Error cleaning up archives for ${collectionKey}`, error);
            throw error;
        }
    }
}

module.exports = new ArchiveService(); 