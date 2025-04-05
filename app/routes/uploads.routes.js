/**
 * Upload Routes
 */
const express = require('express');
const router = express.Router();
const uploadsController = require('../controllers/uploads.controller');
const { authenticate } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// POST /api/uploads/image - Upload an image
router.post('/image', authenticate, upload.single('image'), uploadsController.uploadImage);

// POST /api/uploads/file - Upload a file
router.post('/file', authenticate, upload.single('file'), uploadsController.uploadFile);

module.exports = router; 