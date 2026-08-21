const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// Get courses (with filters)
router.get(
  '/',
  courseController.getAll
);

// Get single course
router.get(
  '/:id',
  courseController.getById
);

// Create course (admin)
router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Course name is required.')
      .isLength({ max: 255 }).withMessage('Course name too long.'),
    body('academicLevelId')
      .isInt().withMessage('Academic level is required.'),
    body('semesterId')
      .isInt().withMessage('Semester is required.'),
    body('departmentId')
      .optional()
      .isInt(),
    body('creditHours')
      .optional()
      .isFloat({ min: 0.5, max: 10 }),
  ],
  validate,
  courseController.create
);

// Update course (admin)
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  courseController.update
);

// Delete course (admin)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  courseController.delete
);

module.exports = router;

