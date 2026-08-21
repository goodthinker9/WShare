const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// Get all users (admin)
router.get(
  '/',
  authenticate,
  authorize('admin'),
  userController.getAll
);

// Get pending verifications (admin)
router.get(
  '/pending-verifications',
  authenticate,
  authorize('admin'),
  userController.getPendingVerifications
);

// Get single user (admin)
router.get(
  '/:id',
  authenticate,
  authorize('admin'),
  userController.getById
);

// Get user's university ID card image (admin)
router.get(
  '/:id/id-card',
  authenticate,
  authorize('admin'),
  userController.getIDCard
);

// Verify student (admin)
router.put(
  '/:id/verify',
  authenticate,
  authorize('admin'),
  [
    body('action')
      .isIn(['approved', 'rejected']).withMessage('Action must be approved or rejected.'),
  ],
  validate,
  userController.verifyStudent
);

// Update user status (admin)
router.put(
  '/:id/status',
  authenticate,
  authorize('admin'),
  [
    body('status')
      .isIn(['active', 'suspended', 'disabled']).withMessage('Invalid status.'),
  ],
  validate,
  userController.updateStatus
);

// Update user assignment (admin)
router.put(
  '/:id/assign',
  authenticate,
  authorize('admin'),
  userController.updateAssignment
);

// Delete user (admin)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  userController.deleteUser
);

module.exports = router;

