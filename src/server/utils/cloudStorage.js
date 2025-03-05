const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

// Configure AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

// Configure multer for S3
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        acl: 'public-read',
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    }),
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

// Upload file to S3
const uploadToCloud = async (file) => {
    try {
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.fieldname + '-' + Date.now() + path.extname(file.originalname),
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read'
        };

        const result = await s3.upload(params).promise();
        return result.Location;
    } catch (error) {
        throw new Error('Error uploading file to cloud storage: ' + error.message);
    }
};

// Delete file from S3
const deleteFromCloud = async (fileUrl) => {
    try {
        const key = fileUrl.split('/').pop();
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        };

        await s3.deleteObject(params).promise();
        return true;
    } catch (error) {
        throw new Error('Error deleting file from cloud storage: ' + error.message);
    }
};

// Get signed URL for temporary access
const getSignedUrl = async (fileUrl, expiresIn = 3600) => {
    try {
        const key = fileUrl.split('/').pop();
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Expires: expiresIn
        };

        return await s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
        throw new Error('Error generating signed URL: ' + error.message);
    }
};

module.exports = {
    upload,
    uploadToCloud,
    deleteFromCloud,
    getSignedUrl
}; 