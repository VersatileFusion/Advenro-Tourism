const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

class LoggingService {
    constructor() {
        this.logDir = path.join(process.cwd(), 'logs');
        this.setupLoggers();
    }

    setupLoggers() {
        // Define log formats
        const consoleFormat = winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ level, message, timestamp, ...metadata }) => {
                let msg = `${timestamp} [${level}]: ${message}`;
                if (Object.keys(metadata).length > 0) {
                    msg += ` ${JSON.stringify(metadata)}`;
                }
                return msg;
            })
        );

        const fileFormat = winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        );

        // Create transport for application logs
        const appTransport = new DailyRotateFile({
            filename: path.join(this.logDir, 'app-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: fileFormat
        });

        // Create transport for error logs
        const errorTransport = new DailyRotateFile({
            filename: path.join(this.logDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
            level: 'error',
            format: fileFormat
        });

        // Create transport for access logs
        const accessTransport = new DailyRotateFile({
            filename: path.join(this.logDir, 'access-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: fileFormat
        });

        // Create loggers
        this.appLogger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            transports: [
                new winston.transports.Console({ format: consoleFormat }),
                appTransport,
                errorTransport
            ]
        });

        this.accessLogger = winston.createLogger({
            transports: [accessTransport]
        });

        // Handle transport errors
        [appTransport, errorTransport, accessTransport].forEach(transport => {
            transport.on('rotate', (oldFilename, newFilename) => {
                this.appLogger.info('Rotating log files', { oldFilename, newFilename });
            });

            transport.on('error', (error) => {
                console.error('Error in log transport:', error);
            });
        });
    }

    // Application logging methods
    info(message, metadata = {}) {
        this.appLogger.info(message, metadata);
    }

    error(message, error = null, metadata = {}) {
        const errorData = error ? {
            message: error.message,
            stack: error.stack,
            ...metadata
        } : metadata;

        this.appLogger.error(message, errorData);
    }

    warn(message, metadata = {}) {
        this.appLogger.warn(message, metadata);
    }

    debug(message, metadata = {}) {
        this.appLogger.debug(message, metadata);
    }

    // Access logging
    logAccess(req, res, responseTime) {
        const logData = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            status: res.statusCode,
            responseTime,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            userId: req.user ? req.user.id : null
        };

        this.accessLogger.info('Access Log', logData);
    }

    // Error logging middleware
    errorMiddleware(err, req, res, next) {
        this.error('Express error', err, {
            url: req.url,
            method: req.method,
            body: req.body,
            userId: req.user ? req.user.id : null
        });
        next(err);
    }

    // Request logging middleware
    requestMiddleware(req, res, next) {
        const start = Date.now();

        // Log when the response is finished
        res.on('finish', () => {
            const duration = Date.now() - start;
            this.logAccess(req, res, duration);
        });

        next();
    }

    // Performance logging
    logPerformance(operation, duration, metadata = {}) {
        this.appLogger.info('Performance metric', {
            operation,
            duration,
            ...metadata
        });
    }

    // Security event logging
    logSecurityEvent(event, metadata = {}) {
        this.appLogger.warn('Security event', {
            event,
            timestamp: new Date().toISOString(),
            ...metadata
        });
    }
}

module.exports = new LoggingService(); 