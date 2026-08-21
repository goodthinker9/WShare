const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Health check for admin
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Admin API is operational.' });
});

module.exports = router;

