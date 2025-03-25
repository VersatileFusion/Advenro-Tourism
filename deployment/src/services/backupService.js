const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const cron = require('node-cron');
const logger = require('./loggingService');
const { compress, decompress } = require('gzip-utils');

class BackupService {
    constructor() {
        this.backupDir = path.join(process.cwd(), 'backups');
        this.maxBackups = process.env.MAX_BACKUPS || 30; // Keep last 30 days of backups
        this.setupBackupDirectory();
    }

    async setupBackupDirectory() {
        try {
            await fs.mkdir(this.backupDir, { recursive: true });
            logger.info('Backup directory created', { path: this.backupDir });
        } catch (error) {
            logger.error('Error creating backup directory', error);
        }
    }

    async createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(this.backupDir, `backup-${timestamp}.gz`);

        try {
            // Create mongodump process
            const mongodump = spawn('mongodump', [
                `--uri=${process.env.MONGODB_URI}`,
                '--gzip',
                `--archive=${backupPath}`,
                '--forceTableScan'
            ]);

            return new Promise((resolve, reject) => {
                mongodump.on('close', (code) => {
                    if (code === 0) {
                        logger.info('Database backup created successfully', {
                            path: backupPath,
                            timestamp
                        });
                        this.cleanOldBackups();
                        resolve(backupPath);
                    } else {
                        reject(new Error(`Backup failed with code ${code}`));
                    }
                });

                mongodump.stderr.on('data', (data) => {
                    logger.debug('Mongodump output:', { data: data.toString() });
                });

                mongodump.on('error', (error) => {
                    logger.error('Backup process error', error);
                    reject(error);
                });
            });
        } catch (error) {
            logger.error('Error creating backup', error);
            throw error;
        }
    }

    async restoreBackup(backupPath) {
        try {
            // Create mongorestore process
            const mongorestore = spawn('mongorestore', [
                `--uri=${process.env.MONGODB_URI}`,
                '--gzip',
                `--archive=${backupPath}`,
                '--drop' // Drop existing collections before restore
            ]);

            return new Promise((resolve, reject) => {
                mongorestore.on('close', (code) => {
                    if (code === 0) {
                        logger.info('Database restored successfully', {
                            path: backupPath
                        });
                        resolve();
                    } else {
                        reject(new Error(`Restore failed with code ${code}`));
                    }
                });

                mongorestore.stderr.on('data', (data) => {
                    logger.debug('Mongorestore output:', { data: data.toString() });
                });

                mongorestore.on('error', (error) => {
                    logger.error('Restore process error', error);
                    reject(error);
                });
            });
        } catch (error) {
            logger.error('Error restoring backup', error);
            throw error;
        }
    }

    async cleanOldBackups() {
        try {
            const files = await fs.readdir(this.backupDir);
            const backupFiles = files
                .filter(file => file.startsWith('backup-'))
                .map(file => ({
                    name: file,
                    path: path.join(this.backupDir, file),
                    timestamp: new Date(file.replace('backup-', '').replace('.gz', ''))
                }))
                .sort((a, b) => b.timestamp - a.timestamp);

            // Keep only the most recent backups
            const filesToDelete = backupFiles.slice(this.maxBackups);
            
            for (const file of filesToDelete) {
                await fs.unlink(file.path);
                logger.info('Deleted old backup', { path: file.path });
            }
        } catch (error) {
            logger.error('Error cleaning old backups', error);
        }
    }

    async listBackups() {
        try {
            const files = await fs.readdir(this.backupDir);
            return files
                .filter(file => file.startsWith('backup-'))
                .map(file => ({
                    name: file,
                    path: path.join(this.backupDir, file),
                    timestamp: new Date(file.replace('backup-', '').replace('.gz', '')),
                    size: fs.statSync(path.join(this.backupDir, file)).size
                }))
                .sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            logger.error('Error listing backups', error);
            return [];
        }
    }

    scheduleBackups() {
        // Schedule daily backup at 2 AM
        cron.schedule('0 2 * * *', async () => {
            try {
                await this.createBackup();
                logger.info('Scheduled backup completed');
            } catch (error) {
                logger.error('Scheduled backup failed', error);
            }
        });
    }

    async verifyBackup(backupPath) {
        try {
            // Create temporary directory for verification
            const verifyDir = path.join(this.backupDir, 'verify');
            await fs.mkdir(verifyDir, { recursive: true });

            // Extract backup to verify its integrity
            const mongorestore = spawn('mongorestore', [
                '--gzip',
                `--archive=${backupPath}`,
                '--dryRun',
                `--dir=${verifyDir}`
            ]);

            return new Promise((resolve, reject) => {
                mongorestore.on('close', async (code) => {
                    try {
                        await fs.rm(verifyDir, { recursive: true });
                        if (code === 0) {
                            logger.info('Backup verification successful', { path: backupPath });
                            resolve(true);
                        } else {
                            reject(new Error(`Backup verification failed with code ${code}`));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });

                mongorestore.on('error', (error) => {
                    logger.error('Backup verification error', error);
                    reject(error);
                });
            });
        } catch (error) {
            logger.error('Error verifying backup', error);
            throw error;
        }
    }
}

module.exports = new BackupService(); 