const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err.stack);

    // Check if the request accepts HTML
    const acceptsHtml = req.accepts('html');

    // Handle HTML requests differently
    if (acceptsHtml) {
        // Determine status code
        const statusCode = err.status || 500;
        
        // Serve appropriate error page
        if (statusCode === 404) {
            return res.status(404).sendFile('404.html', { root: './public' });
        } else {
            return res.status(500).sendFile('500.html', { root: './public' });
        }
    }

    // For API requests, return JSON responses
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: Object.values(err.errors).map(error => error.message)
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'Duplicate field value entered',
            errors: Object.keys(err.keyValue).map(key => `${key} already exists`)
        });
    }

    // JWT error
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }

    // Multer error
    if (err.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            message: 'File upload error',
            errors: [err.message]
        });
    }

    // Default error
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        errors: process.env.NODE_ENV === 'development' ? [err.stack] : undefined
    });
};

module.exports = errorHandler; 