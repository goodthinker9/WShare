const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();
const resourceController = require('../controllers/resource.controller');
const { authenticate, authorize, requireVerifiedStudent } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { upload, handleUploadError } = require('../middleware/upload');

// Student dashboard (filtered resources)
router.get(
  '/dashboard',
  authenticate,
  requireVerifiedStudent,
  [
    query('category')
      .optional()
      .isIn(['course_material', 'assignment', 'past_exam']).withMessage('Category must be course_material, assignment, or past_exam.')
  ],
  validate,
  resourceController.getDashboard
);

// Get all resources (admin) - MUST be defined before /:id
router.get(
  '/all',
  authenticate,
  authorize('admin'),
  [
    query('departmentId')
      .optional()
      .isInt().withMessage('Department ID must be an integer.'),
    query('category')
      .optional()
      .isIn(['course_material', 'assignment', 'past_exam']).withMessage('Category must be course_material, assignment, or past_exam.')
  ],
  validate,
  resourceController.getAll
);

// Search resources (students must be verified/approved; admins pass through)
router.get(
  '/search',
  authenticate,
  requireVerifiedStudent,
  [
    query('q').optional().trim(),
    query('departmentId').optional().isInt().withMessage('Department ID must be an integer.'),
    query('academicLevelId').optional().isInt().withMessage('Academic level ID must be an integer.'),
    query('semesterId').optional().isInt().withMessage('Semester ID must be an integer.'),
    query('courseId').optional().isInt().withMessage('Course ID must be an integer.')
  ],
  validate,
  resourceController.search
);

// Get pending resources (admin only)
router.get(
  '/pending',
  authenticate,
  authorize('admin'),
  resourceController.getPending
);

// Preview/stream file (admin can preview pending; students only verified/approved)
router.get(
  '/:id/file',
  authenticate,
  requireVerifiedStudent,
  resourceController.previewFile
);

// Get single resource
router.get(
  '/:id',
  authenticate,
  requireVerifiedStudent,
  resourceController.getById
);

// Upload resource
router.post(
  '/upload',
  authenticate,
  requireVerifiedStudent,
  upload.single('file'),
  handleUploadError,
  [
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required.')
      .isLength({ max: 255 }).withMessage('Title must be at most 255 characters.'),
body('description')
      .optional()
      .trim(),
    body('category')
      .optional()
      .isIn(['course_material', 'assignment', 'past_exam']).withMessage('Category must be course_material, assignment, or past_exam.'),
    body('chapter')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Chapter must be at most 100 characters.'),
  ],
  validate,
  resourceController.upload
);

// Update resource (admin only)
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  resourceController.update
);

// Delete resource (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  resourceController.delete
);

// Approve/reject resource (admin only)
router.put(
  '/:id/review',
  authenticate,
  authorize('admin'),
  [
    body('status')
      .isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected.'),
  ],
  validate,
  resourceController.review
);

module.exports = router;

