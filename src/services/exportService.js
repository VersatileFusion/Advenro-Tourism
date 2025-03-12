const json2csv = require('json2csv').Parser;
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs').promises;
const logger = require('./loggingService');

class ExportService {
    constructor() {
        this.exportDir = path.join(process.cwd(), 'exports');
        this.setupExportDirectory();
    }

    async setupExportDirectory() {
        try {
            await fs.mkdir(this.exportDir, { recursive: true });
            logger.info('Export directory created', { path: this.exportDir });
        } catch (error) {
            logger.error('Error creating export directory', error);
        }
    }

    async exportToCSV(data, options = {}) {
        try {
            const {
                fields,
                filename = `export-${Date.now()}.csv`,
                delimiter = ',',
            } = options;

            const parser = new json2csv({
                fields,
                delimiter,
                flattenObjects: true,
                includeEmptyRows: false
            });

            const csv = parser.parse(data);
            const filePath = path.join(this.exportDir, filename);
            
            await fs.writeFile(filePath, csv, 'utf-8');
            
            logger.info('CSV export completed', {
                filename,
                records: data.length
            });

            return filePath;
        } catch (error) {
            logger.error('Error exporting to CSV', error);
            throw new Error('Failed to export data to CSV');
        }
    }

    async exportToExcel(data, options = {}) {
        try {
            const {
                sheetName = 'Sheet1',
                filename = `export-${Date.now()}.xlsx`,
            } = options;

            const workbook = xlsx.utils.book_new();
            const worksheet = xlsx.utils.json_to_sheet(data);
            
            xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
            
            const filePath = path.join(this.exportDir, filename);
            await xlsx.writeFile(workbook, filePath);

            logger.info('Excel export completed', {
                filename,
                records: data.length
            });

            return filePath;
        } catch (error) {
            logger.error('Error exporting to Excel', error);
            throw new Error('Failed to export data to Excel');
        }
    }

    async exportToJSON(data, options = {}) {
        try {
            const {
                filename = `export-${Date.now()}.json`,
                pretty = true
            } = options;

            const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
            const filePath = path.join(this.exportDir, filename);
            
            await fs.writeFile(filePath, json, 'utf-8');

            logger.info('JSON export completed', {
                filename,
                records: Array.isArray(data) ? data.length : 1
            });

            return filePath;
        } catch (error) {
            logger.error('Error exporting to JSON', error);
            throw new Error('Failed to export data to JSON');
        }
    }

    async exportBookings(bookings, format = 'csv') {
        const fields = [
            'id',
            'userId',
            'tourId',
            'startDate',
            'endDate',
            'status',
            'totalAmount',
            'paymentStatus',
            'createdAt'
        ];

        const filename = `bookings-export-${Date.now()}.${format}`;

        switch (format.toLowerCase()) {
            case 'csv':
                return this.exportToCSV(bookings, { fields, filename });
            case 'xlsx':
                return this.exportToExcel(bookings, { filename });
            case 'json':
                return this.exportToJSON(bookings, { filename });
            default:
                throw new Error('Unsupported export format');
        }
    }

    async exportUsers(users, format = 'csv') {
        const fields = [
            'id',
            'name',
            'email',
            'role',
            'createdAt',
            'lastLogin'
        ];

        const filename = `users-export-${Date.now()}.${format}`;
        const sanitizedUsers = users.map(user => ({
            ...user,
            password: undefined,
            tokens: undefined
        }));

        switch (format.toLowerCase()) {
            case 'csv':
                return this.exportToCSV(sanitizedUsers, { fields, filename });
            case 'xlsx':
                return this.exportToExcel(sanitizedUsers, { filename });
            case 'json':
                return this.exportToJSON(sanitizedUsers, { filename });
            default:
                throw new Error('Unsupported export format');
        }
    }

    async exportTours(tours, format = 'csv') {
        const fields = [
            'id',
            'name',
            'description',
            'price',
            'duration',
            'maxGroupSize',
            'difficulty',
            'averageRating',
            'createdAt'
        ];

        const filename = `tours-export-${Date.now()}.${format}`;

        switch (format.toLowerCase()) {
            case 'csv':
                return this.exportToCSV(tours, { fields, filename });
            case 'xlsx':
                return this.exportToExcel(tours, { filename });
            case 'json':
                return this.exportToJSON(tours, { filename });
            default:
                throw new Error('Unsupported export format');
        }
    }

    async cleanOldExports(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
        try {
            const files = await fs.readdir(this.exportDir);
            const now = Date.now();

            for (const file of files) {
                const filePath = path.join(this.exportDir, file);
                const stats = await fs.stat(filePath);
                const age = now - stats.mtimeMs;

                if (age > maxAge) {
                    await fs.unlink(filePath);
                    logger.info('Deleted old export file', { path: filePath });
                }
            }
        } catch (error) {
            logger.error('Error cleaning old exports', error);
        }
    }
}

module.exports = new ExportService(); 