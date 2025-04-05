/**
 * Upload Middleware
 * Handles file uploads using multer
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = uploadDir;
    
    // Create subdirectories based on file type
    if (file.mimetype.startsWith('image/')) {
      dest = path.join(uploadDir, 'images');
    } else {
      dest = path.join(uploadDir, 'files');
    }
    
    // Ensure directory exists
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to validate uploads
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedFileTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  
  // Check file type
  if (file.fieldname === 'image' && !allowedImageTypes.includes(file.mimetype)) {
    const error = new Error('Only JPEG, PNG, GIF, and WebP images are allowed');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }
  
  if (file.fieldname === 'file' && !allowedFileTypes.includes(file.mimetype)) {
    const error = new Error('Invalid file type');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }
  
  // Accept file
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

module.exports = upload; 