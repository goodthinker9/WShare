/**
 * Validate Wollo University student ID format
 * Format: WOUR/XXXX/YY where XXXX = 4 digits, YY = batch (16-19)
 */
const validateStudentId = (studentId) => {
  if (!studentId) return { valid: false, message: 'Student ID is required.' };
  
  const pattern = /^WOUR\/(\d{4})\/(1[6-9])$/;
  const match = studentId.match(pattern);
  
  if (!match) {
    return { 
      valid: false, 
      message: 'Invalid Student ID format. Must be WOUR/XXXX/YY (e.g., WOUR/0014/16).' 
    };
  }
  
  return { valid: true, digits: match[1], batch: match[2] };
};

/**
 * Generate pagination metadata
 */
const getPagination = (page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;
  
  // Return both naming conventions to support legacy { p, l } destructuring
  return { page: pageNum, limit: limitNum, p: pageNum, l: limitNum, offset };
};

/**
 * Format paginated response
 */
const paginatedResponse = (data, total, page, limit) => {
  return {
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

/**
 * Safe parse JSON field
 */
const safeJsonParse = (str, defaultValue = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
};

/**
 * Generate a unique filename
 */
const generateUniqueFilename = (originalName) => {
  const { v4: uuidv4 } = require('uuid');
  const ext = require('path').extname(originalName);
  return `${uuidv4()}${ext}`;
};

/**
 * Sanitize string for SQL LIKE
 */
const sanitizeLike = (str) => {
  return str.replace(/[%_]/g, '\\$&');
};

module.exports = {
  validateStudentId,
  getPagination,
  paginatedResponse,
  safeJsonParse,
  generateUniqueFilename,
  sanitizeLike
};

