const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Get dashboard stats (admin)
router.get(
  '/dashboard',
  authenticate,
  authorize('admin'),
  analyticsController.getDashboardStats
);

// Get chart data (admin)
router.get(
  '/charts',
  authenticate,
  authorize('admin'),
  analyticsController.getCharts
);

// Get most downloaded resources (admin)
router.get(
  '/top-resources',
  authenticate,
  authorize('admin'),
  analyticsController.getTopResources
);

// Get most active students (admin)
router.get(
  '/active-students',
  authenticate,
  authorize('admin'),
  analyticsController.getActiveStudents
);

// Get verification statistics (admin)
router.get(
  '/verifications',
  authenticate,
  authorize('admin'),
  analyticsController.getVerificationStats
);

// Get department statistics (admin)
router.get(
  '/departments',
  authenticate,
  authorize('admin'),
  analyticsController.getDepartmentStats
);

// Get recent activities (admin)
router.get(
  '/activities',
  authenticate,
  authorize('admin'),
  analyticsController.getRecentActivities
);

module.exports = router;

