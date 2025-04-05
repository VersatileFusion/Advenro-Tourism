/**
 * Uploads Controller
 * Handles file upload requests
 */

// Mock uploads data
const uploads = [
  {
    id: 'upload_1',
    userId: 'user_123',
    type: 'image',
    path: '/uploads/images/avatar-1234567890.jpg',
    filename: 'avatar-1234567890.jpg',
    originalName: 'profile.jpg',
    mimeType: 'image/jpeg',
    size: 1024 * 1024 * 2, // 2MB
    createdAt: '2024-03-15T10:30:22Z'
  },
  {
    id: 'upload_2',
    userId: 'user_123',
    type: 'file',
    path: '/uploads/files/document-1234567891.pdf',
    filename: 'document-1234567891.pdf',
    originalName: 'travel_itinerary.pdf',
    mimeType: 'application/pdf',
    size: 1024 * 1024 * 1.5, // 1.5MB
    createdAt: '2024-03-16T14:22:10Z'
  }
];

/**
 * Upload an image
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.uploadImage = async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      const error = new Error('No image uploaded');
      error.status = 400;
      error.code = 'NO_FILE_UPLOADED';
      throw error;
    }
    
    // Validate file type
    if (!req.file.mimetype.startsWith('image/')) {
      const error = new Error('File must be an image');
      error.status = 400;
      error.code = 'INVALID_FILE_TYPE';
      throw error;
    }
    
    // Create upload record
    const uploadRecord = {
      id: `upload_${Date.now()}`,
      userId: req.user.id,
      type: 'image',
      path: `/uploads/images/${req.file.filename}`,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      createdAt: new Date().toISOString()
    };
    
    // Save to database (mock)
    uploads.push(uploadRecord);
    
    res.status(201).json({
      success: true,
      data: {
        url: uploadRecord.path,
        id: uploadRecord.id,
        filename: uploadRecord.filename
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload a file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.uploadFile = async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      const error = new Error('No file uploaded');
      error.status = 400;
      error.code = 'NO_FILE_UPLOADED';
      throw error;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      const error = new Error('File is too large (max 5MB)');
      error.status = 400;
      error.code = 'FILE_TOO_LARGE';
      throw error;
    }
    
    // Create upload record
    const uploadRecord = {
      id: `upload_${Date.now()}`,
      userId: req.user.id,
      type: 'file',
      path: `/uploads/files/${req.file.filename}`,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      createdAt: new Date().toISOString()
    };
    
    // Save to database (mock)
    uploads.push(uploadRecord);
    
    res.status(201).json({
      success: true,
      data: {
        url: uploadRecord.path,
        id: uploadRecord.id,
        filename: uploadRecord.filename
      }
    });
  } catch (error) {
    next(error);
  }
}; 