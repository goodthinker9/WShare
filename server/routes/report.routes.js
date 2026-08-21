const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate, authorize, requireVerifiedStudent } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// Create a report
router.post(
  '/',
  authenticate,
  requireVerifiedStudent,
  [
    body('resourceId')
      .isInt().withMessage('Resource ID is required.'),
    body('reason')
      .isIn(['spam', 'copyright', 'duplicate', 'low_quality', 'wrong_department', 'other'])
      .withMessage('Invalid report reason.'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Description must be at most 1000 characters.'),
  ],
  validate,
  reportController.createReport
);

// Get reports (admin)
router.get(
  '/',
  authenticate,
  authorize('admin'),
  reportController.getReports
);

// Resolve a report (admin)
router.put(
  '/:id/resolve',
  authenticate,
  authorize('admin'),
  [
    body('status')
      .isIn(['resolved', 'dismissed']).withMessage('Status must be resolved or dismissed.'),
  ],
  validate,
  reportController.resolveReport
);

module.exports = router;

