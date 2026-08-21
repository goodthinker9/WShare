const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { AppError } = require('./errorHandler');

// Allowed MIME types
const ALLOWED_MIME_TYPES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword': '.doc',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/zip': '.zip',
  'application/x-rar-compressed': '.rar',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/x-msvideo': '.avi',
  'video/x-matroska': '.mkv',
  'video/quicktime': '.mov'
};

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.ppt', '.pptx', '.zip', '.rar', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.avi', '.mkv', '.mov'];

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', config.upload.dir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new AppError(`File type ${ext} is not allowed.`, 400, 'INVALID_FILE_TYPE'), false);
  }
  
  // Verify MIME type matches extension
  const expectedExt = ALLOWED_MIME_TYPES[file.mimetype];
  if (expectedExt && expectedExt !== ext) {
    return cb(new AppError('File MIME type does not match extension.', 400, 'MIME_MISMATCH'), false);
  }
  
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 1
  }
});

/**
 * Middleware to handle multer errors gracefully
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File too large. Maximum size is 50MB.', 413, 'FILE_TOO_LARGE'));
    }
    return next(new AppError(err.message, 400, 'UPLOAD_ERROR'));
  }
  next(err);
};

module.exports = { upload, handleUploadError, ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS };

