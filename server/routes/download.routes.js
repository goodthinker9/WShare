const express = require('express');
const router = express.Router();
const downloadController = require('../controllers/download.controller');
const { authenticate, requireVerifiedStudent } = require('../middleware/auth');

// Record and serve download
router.post(
  '/:resourceId',
  authenticate,
  requireVerifiedStudent,
  downloadController.download
);

// Get download history
router.get(
  '/history',
  authenticate,
  requireVerifiedStudent,
  downloadController.getHistory
);

module.exports = router;

