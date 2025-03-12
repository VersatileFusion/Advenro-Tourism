const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./loggingService');

class MigrationService {
    constructor() {
        this.migrationsDir = path.join(process.cwd(), 'src', 'migrations');
        this.migrationModel = mongoose.model('Migration', new mongoose.Schema({
            name: { type: String, required: true, unique: true },
            appliedAt: { type: Date, required: true },
            version: { type: Number, required: true }
        }));
    }

    async initialize() {
        try {
            await fs.mkdir(this.migrationsDir, { recursive: true });
            logger.info('Migrations directory created', { path: this.migrationsDir });
        } catch (error) {
            logger.error('Error creating migrations directory', error);
            throw error;
        }
    }

    async createMigration(name) {
        try {
            const timestamp = Date.now();
            const version = await this.getNextVersion();
            const filename = `${version}_${name}.js`;
            const filePath = path.join(this.migrationsDir, filename);

            const template = `
                module.exports = {
                    version: ${version},
                    name: '${name}',
                    up: async (db) => {
                        // Migration up code here
                    },
                    down: async (db) => {
                        // Migration down code here
                    }
                };
            `;

            await fs.writeFile(filePath, template.trim());
            logger.info('Migration file created', { name, version, path: filePath });
            return filePath;
        } catch (error) {
            logger.error('Error creating migration file', error);
            throw error;
        }
    }

    async getNextVersion() {
        try {
            const lastMigration = await this.migrationModel
                .findOne()
                .sort({ version: -1 });
            return lastMigration ? lastMigration.version + 1 : 1;
        } catch (error) {
            logger.error('Error getting next migration version', error);
            throw error;
        }
    }

    async getMigrationFiles() {
        try {
            const files = await fs.readdir(this.migrationsDir);
            return files
                .filter(file => file.endsWith('.js'))
                .sort((a, b) => {
                    const versionA = parseInt(a.split('_')[0]);
                    const versionB = parseInt(b.split('_')[0]);
                    return versionA - versionB;
                });
        } catch (error) {
            logger.error('Error getting migration files', error);
            throw error;
        }
    }

    async getAppliedMigrations() {
        try {
            return await this.migrationModel
                .find()
                .sort({ version: 1 });
        } catch (error) {
            logger.error('Error getting applied migrations', error);
            throw error;
        }
    }

    async migrate(direction = 'up', targetVersion = null) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const files = await this.getMigrationFiles();
            const appliedMigrations = await this.getAppliedMigrations();

            let migrationsToRun = [];

            if (direction === 'up') {
                migrationsToRun = files.filter(file => {
                    const version = parseInt(file.split('_')[0]);
                    const isApplied = appliedMigrations.some(m => m.version === version);
                    return !isApplied && (!targetVersion || version <= targetVersion);
                });
            } else {
                migrationsToRun = files.filter(file => {
                    const version = parseInt(file.split('_')[0]);
                    const isApplied = appliedMigrations.some(m => m.version === version);
                    return isApplied && (!targetVersion || version > targetVersion);
                }).reverse();
            }

            for (const file of migrationsToRun) {
                const migration = require(path.join(this.migrationsDir, file));
                const { version, name } = migration;

                logger.info(`Running migration ${direction}`, { version, name });

                if (direction === 'up') {
                    await migration.up(mongoose.connection.db);
                    await this.migrationModel.create([{
                        version,
                        name,
                        appliedAt: new Date()
                    }], { session });
                } else {
                    await migration.down(mongoose.connection.db);
                    await this.migrationModel.deleteOne({ version }, { session });
                }

                logger.info(`Migration ${direction} completed`, { version, name });
            }

            await session.commitTransaction();
            logger.info('Migration process completed', {
                direction,
                count: migrationsToRun.length
            });
        } catch (error) {
            await session.abortTransaction();
            logger.error('Migration process failed', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    async rollback(steps = 1) {
        try {
            const appliedMigrations = await this.getAppliedMigrations();
            if (appliedMigrations.length === 0) {
                logger.info('No migrations to rollback');
                return;
            }

            const targetVersion = steps === 'all' 
                ? 0 
                : appliedMigrations[appliedMigrations.length - steps - 1]?.version || 0;

            await this.migrate('down', targetVersion);
        } catch (error) {
            logger.error('Rollback failed', error);
            throw error;
        }
    }

    async reset() {
        try {
            await this.rollback('all');
            logger.info('Database reset completed');
        } catch (error) {
            logger.error('Database reset failed', error);
            throw error;
        }
    }

    async status() {
        try {
            const files = await this.getMigrationFiles();
            const appliedMigrations = await this.getAppliedMigrations();

            return files.map(file => {
                const version = parseInt(file.split('_')[0]);
                const name = file.split('_')[1].replace('.js', '');
                const applied = appliedMigrations.find(m => m.version === version);

                return {
                    version,
                    name,
                    status: applied ? 'applied' : 'pending',
                    appliedAt: applied?.appliedAt
                };
            });
        } catch (error) {
            logger.error('Error getting migration status', error);
            throw error;
        }
    }

    async repair() {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const files = await this.getMigrationFiles();
            const appliedMigrations = await this.getAppliedMigrations();

            // Remove migrations that don't have corresponding files
            const orphanedMigrations = appliedMigrations.filter(migration => 
                !files.some(file => parseInt(file.split('_')[0]) === migration.version)
            );

            if (orphanedMigrations.length > 0) {
                await this.migrationModel.deleteMany({
                    version: { $in: orphanedMigrations.map(m => m.version) }
                }, { session });

                logger.info('Removed orphaned migrations', {
                    count: orphanedMigrations.length,
                    versions: orphanedMigrations.map(m => m.version)
                });
            }

            await session.commitTransaction();
            logger.info('Migration repair completed');
        } catch (error) {
            await session.abortTransaction();
            logger.error('Migration repair failed', error);
            throw error;
        } finally {
            session.endSession();
        }
    }
}

module.exports = new MigrationService(); 