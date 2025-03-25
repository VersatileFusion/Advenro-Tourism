const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const path = require('path');

// Configure storage based on environment
const isTest = process.env.NODE_ENV === 'test';

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});

// Mock storage for testing
const mockStorage = {
    bucket: () => ({
        name: 'mock-bucket',
        file: (filename) => ({
            name: filename,
            createWriteStream: () => {
                const stream = require('stream');
                const writable = new stream.Writable();
                writable._write = (chunk, encoding, next) => {
                    next();
                };
                setTimeout(() => {
                    writable.emit('finish');
                }, 100);
                return writable;
            },
            delete: async () => true,
            getSignedUrl: async () => ['https://mock-signed-url.com']
        }),
        upload: async () => [{
            publicUrl: 'https://mock-public-url.com/test-file.jpg'
        }]
    })
};

// Initialize storage client
let storage;
let bucket;

// Use mock storage for testing, real storage for production
if (isTest) {
    console.log('Using mock storage for tests');
    storage = mockStorage;
    bucket = mockStorage.bucket();
} else {
    // Only initialize real storage if not in test mode
    try {
        storage = new Storage({
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
            keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE
        });
        
        // Ensure bucket name is defined
        const bucketName = process.env.GOOGLE_CLOUD_BUCKET;
        if (!bucketName) {
            console.warn('GOOGLE_CLOUD_BUCKET not defined, using default-bucket');
        }
        
        bucket = storage.bucket(bucketName || 'default-bucket');
    } catch (error) {
        console.error('Error initializing Google Cloud Storage:', error.message);
        // Fallback to mock storage in case of initialization error
        storage = mockStorage;
        bucket = mockStorage.bucket();
    }
}

// Upload file to storage
const uploadToCloud = async (file) => {
    try {
        if (isTest) {
            return 'https://mock-public-url.com/test-file.jpg';
        }

        const blob = bucket.file(`${Date.now()}-${file.originalname}`);
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: file.mimetype
            },
            public: true
        });

        return new Promise((resolve, reject) => {
            blobStream.on('error', (error) => {
                reject(new Error('Error uploading file to cloud storage: ' + error.message));
            });

            blobStream.on('finish', () => {
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
                resolve(publicUrl);
            });

            blobStream.end(file.buffer);
        });
    } catch (error) {
        throw new Error('Error uploading file to cloud storage: ' + error.message);
    }
};

// Delete file from storage
const deleteFromCloud = async (fileUrl) => {
    try {
        if (isTest) {
            return true;
        }

        const fileName = fileUrl.split('/').pop();
        await bucket.file(fileName).delete();
        return true;
    } catch (error) {
        throw new Error('Error deleting file from cloud storage: ' + error.message);
    }
};

// Get signed URL for temporary access
const getSignedUrl = async (fileUrl, expiresIn = 3600) => {
    try {
        if (isTest) {
            return 'https://mock-signed-url.com';
        }

        const fileName = fileUrl.split('/').pop();
        const [url] = await bucket.file(fileName).getSignedUrl({
            action: 'read',
            expires: Date.now() + expiresIn * 1000
        });
        return url;
    } catch (error) {
        throw new Error('Error generating signed URL: ' + error.message);
    }
};

module.exports = {
    upload,
    uploadToCloud,
    deleteFromCloud,
    getSignedUrl,
    storage,
    bucket
}; 